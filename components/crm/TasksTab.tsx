'use client';
import { useState } from 'react';
import { Account, Task, TaskStatus, TaskPriority } from '@/lib/crmTypes';
import { useCrm } from '@/context/CrmContext';
import { useConfig } from '@/context/ConfigContext';
import { useToast } from '@/context/ToastContext';
import { TaskDetailDrawer, DrawerTask } from './TaskDetailDrawer';

const STATUS_COLOR: Record<TaskStatus, string> = {
  'To do': 'var(--text3)', 'In progress': 'var(--blue)', 'Done': 'var(--green)', 'Blocked': 'var(--red)',
};
const PRIORITY_COLOR: Record<TaskPriority, string> = { Low: 'var(--text3)', Medium: 'var(--amber)', High: 'var(--accent)', Critical: 'var(--red)' };
const PRIORITY_BG: Record<TaskPriority, string> = { Low: 'var(--bg4)', Medium: 'var(--amber-dim)', High: 'var(--accent-dim)', Critical: 'var(--red-dim)' };
const STATUS_ORDER: TaskStatus[] = ['To do', 'In progress', 'Done', 'Blocked'];
const PRIORITY_ORDER: TaskPriority[] = ['Critical', 'High', 'Medium', 'Low'];

function fmt(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function isOverdue(iso?: string, status?: TaskStatus) {
  if (!iso || status === 'Done') return false;
  return new Date(iso) < new Date();
}

function AddTaskForm({ account, onClose }: { account: Account; onClose: () => void }) {
  const { dispatch } = useCrm();
  const { config } = useConfig();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', status: 'To do' as TaskStatus, priority: 'Medium' as TaskPriority, dueDate: '', assignee: '', opportunityId: '' });
  const inp: React.CSSProperties = { width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 13, padding: '8px 10px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    dispatch({ type: 'ADD_TASK', accountId: account.id, task: { id: `t-${Date.now()}`, title: form.title, description: form.description || undefined, status: form.status, priority: form.priority, dueDate: form.dueDate || undefined, assignee: form.assignee || undefined, opportunityId: form.opportunityId || undefined, createdAt: Date.now(), comments: [] } });
    toast('Task added');
    onClose();
  }
  return (
    <form onSubmit={submit} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>New Task</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <div><label style={lbl}>Title *</label><input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" autoFocus /></div>
        <div><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional context…" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={lbl}>Priority</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
              {(['Low','Medium','High','Critical'] as TaskPriority[]).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Status</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
              {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Due date</label><input type="date" style={inp} value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
          <div><label style={lbl}>Assignee</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
              <option value="">Unassigned</option>
              {config.teamMembers.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        {account.opportunities.length > 0 && (
          <div><label style={lbl}>Link to Opportunity</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.opportunityId} onChange={e => setForm(f => ({ ...f, opportunityId: e.target.value }))}>
              <option value="">General (no opportunity)</option>
              {account.opportunities.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="submit" style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Add Task</button>
        <button type="button" onClick={onClose} style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  );
}

// ── Mini kanban for account tasks ──────────────────────────────
function AccountKanban({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const { toast } = useToast();
  const [drawerTask, setDrawerTask] = useState<DrawerTask | null>(null);

  function cycleStatus(task: Task) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
    dispatch({ type: 'UPDATE_TASK', accountId: account.id, task: { ...task, status: next } });
    toast(`Moved to ${next}`, 'info');
  }

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
      {STATUS_ORDER.map(status => {
        const cards = account.tasks
          .filter(t => t.status === status)
          .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority));
        const col = STATUS_COLOR[status];
        return (
          <div key={status} style={{ minWidth: 220, flex: '1 1 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{status}</span>
              <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '0 5px', color: cards.length ? col : 'var(--text3)', background: cards.length ? col + '18' : 'transparent' }}>{cards.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cards.map(task => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <div key={task.id} onClick={() => setDrawerTask({ ...task, accountId: account.id, accountName: account.name, opportunityName: task.opportunityId ? account.opportunities.find(o => o.id === task.opportunityId)?.name : undefined })}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '10px 12px', cursor: 'pointer', transition: 'border-color 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority] }}>{task.priority}</span>
                      <button onClick={e => { e.stopPropagation(); cycleStatus(task); }} title="Click to advance status"
                        style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, background: status === 'Done' ? 'var(--green)' : 'transparent', border: `2px solid ${col}`, cursor: 'pointer', padding: 0 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: task.status === 'Done' ? 'var(--text3)' : 'var(--text)', lineHeight: 1.4, textDecoration: task.status === 'Done' ? 'line-through' : 'none', marginBottom: 4 }}>{task.title}</div>
                    {task.opportunityId && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>● {account.opportunities.find(o => o.id === task.opportunityId)?.name}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
                      {task.assignee ? <span>→ {task.assignee}</span> : <span />}
                      {task.dueDate && <span>{overdue ? '⚠ ' : ''}{fmt(task.dueDate)}</span>}
                    </div>
                    {task.comments?.length > 0 && (
                      <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        💬 {task.comments[task.comments.length - 1].text}
                      </div>
                    )}
                  </div>
                );
              })}
              {cards.length === 0 && <div style={{ border: '1.5px dashed var(--border2)', borderRadius: 'var(--r)', padding: '20px 0', textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>Empty</div>}
            </div>
          </div>
        );
      })}
      {drawerTask && <TaskDetailDrawer task={drawerTask} onClose={() => setDrawerTask(null)} />}
    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────
export function TasksTab({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const { toast } = useToast();
  const [adding, setAdding]         = useState(false);
  const [viewMode, setViewMode]     = useState<'list' | 'kanban'>('list');
  const [filter, setFilter]         = useState<'All' | TaskStatus>('All');
  const [drawerTask, setDrawerTask] = useState<DrawerTask | null>(null);
  const [delTaskId, setDelTaskId]   = useState<string | null>(null);

  function openDrawer(task: Task) {
    setDrawerTask({ ...task, accountId: account.id, accountName: account.name, opportunityName: task.opportunityId ? account.opportunities.find(o => o.id === task.opportunityId)?.name : undefined });
  }

  function cycleStatus(task: Task) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
    dispatch({ type: 'UPDATE_TASK', accountId: account.id, task: { ...task, status: next } });
    toast(`Moved to ${next}`, 'info');
  }

  function confirmDelete() {
    if (!delTaskId) return;
    const title = account.tasks.find(t => t.id === delTaskId)?.title ?? 'Task';
    dispatch({ type: 'DELETE_TASK', accountId: account.id, taskId: delTaskId });
    toast(`"${title}" deleted`, 'info');
    setDelTaskId(null);
  }

  const tasks = account.tasks
    .filter(t => filter === 'All' || t.status === filter)
    .sort((a, b) => { const pri = { Critical: 0, High: 1, Medium: 2, Low: 3 }; return pri[a.priority] - pri[b.priority]; });

  const general = tasks.filter(t => !t.opportunityId);
  const byOpp   = account.opportunities.map(opp => ({ opp, tasks: tasks.filter(t => t.opportunityId === opp.id) })).filter(g => g.tasks.length > 0);
  const delTarget = delTaskId ? account.tasks.find(t => t.id === delTaskId) : null;

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    background: active ? 'var(--bg4)' : 'transparent',
    border: active ? '1px solid var(--border2)' : '1px solid transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
  });
  const iconBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 'var(--r-xs)', border: active ? '1px solid var(--border2)' : '1px solid transparent',
    background: active ? 'var(--bg4)' : 'transparent', cursor: 'pointer',
    color: active ? 'var(--text)' : 'var(--text3)',
  });

  function renderTask(task: Task) {
    const overdue = isOverdue(task.dueDate, task.status);
    return (
      <div key={task.id} onClick={() => openDrawer(task)}
        style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', marginBottom: 6, display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
        <button onClick={e => { e.stopPropagation(); cycleStatus(task); }} title={`Status: ${task.status}`}
          style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: task.status === 'Done' ? 'var(--green)' : 'transparent', border: `2px solid ${STATUS_COLOR[task.status]}`, cursor: 'pointer' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: task.status === 'Done' ? 'var(--text3)' : 'var(--text)', textDecoration: task.status === 'Done' ? 'line-through' : 'none', marginBottom: 3 }}>{task.title}</div>
          {task.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{task.description}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority] }}>{task.priority}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '18' }}>{task.status}</span>
            {task.dueDate && <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)' }}>{overdue ? '⚠ ' : ''}{fmt(task.dueDate)}</span>}
            {task.assignee && <span style={{ fontSize: 11, color: 'var(--text3)' }}>→ {task.assignee}</span>}
            {task.comments?.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>💬 {task.comments.length}</span>}
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); setDelTaskId(task.id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}>×</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {viewMode === 'list' && (['All', 'To do', 'In progress', 'Blocked', 'Done'] as const).map(s => (
            <button key={s} style={filterBtnStyle(filter === s)} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* View toggle */}
          <button style={iconBtnStyle(viewMode === 'list')} onClick={() => setViewMode('list')} title="List view">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M2 6.5h9M2 9.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
          <button style={iconBtnStyle(viewMode === 'kanban')} onClick={() => setViewMode('kanban')} title="Kanban view">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="3" height="11" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="5" y="1" width="3" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--border2)' }} />
          <button onClick={() => setAdding(a => !a)} style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Add Task</button>
        </div>
      </div>

      {adding && <AddTaskForm account={account} onClose={() => setAdding(false)} />}

      {viewMode === 'kanban' ? (
        <AccountKanban account={account} />
      ) : (
        <>
          {tasks.length === 0 && !adding && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No tasks match this filter.</div>
          )}
          {byOpp.map(({ opp, tasks: oppTasks }) => (
            <div key={opp.id} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent)', fontSize: 10 }}>●</span>{opp.name}
                <span style={{ fontWeight: 400 }}>— {oppTasks.length} task{oppTasks.length !== 1 ? 's' : ''}</span>
              </div>
              {oppTasks.map(renderTask)}
            </div>
          ))}
          {general.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>General</div>
              {general.map(renderTask)}
            </div>
          )}
        </>
      )}

      {drawerTask && <TaskDetailDrawer task={drawerTask} onClose={() => setDrawerTask(null)} />}

      {/* Delete task modal */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDelTaskId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete task?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>"{delTarget.title}"</strong> will be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelTaskId(null)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
