'use client';
import { useState } from 'react';
import { Account, Task, TaskStatus, TaskPriority } from '@/lib/crmTypes';
import { useCrm } from '@/context/CrmContext';
import { TaskDetailDrawer, DrawerTask } from './TaskDetailDrawer';

const STATUS_COLOR: Record<TaskStatus, string> = {
  'To do': 'var(--text3)',
  'In progress': 'var(--blue)',
  'Done': 'var(--green)',
  'Blocked': 'var(--red)',
};

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  Low: 'var(--text3)',
  Medium: 'var(--amber)',
  High: 'var(--accent)',
  Critical: 'var(--red)',
};

const PRIORITY_BG: Record<TaskPriority, string> = {
  Low: 'var(--bg4)',
  Medium: 'var(--amber-dim)',
  High: 'var(--accent-dim)',
  Critical: 'var(--red-dim)',
};

function fmt(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isOverdue(iso?: string, status?: TaskStatus) {
  if (!iso || status === 'Done') return false;
  return new Date(iso) < new Date();
}

interface AddTaskFormProps {
  account: Account;
  onClose: () => void;
}

function AddTaskForm({ account, onClose }: AddTaskFormProps) {
  const { dispatch } = useCrm();
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'To do' as TaskStatus,
    priority: 'Medium' as TaskPriority,
    dueDate: '',
    assignee: '',
    opportunityId: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    dispatch({
      type: 'ADD_TASK',
      accountId: account.id,
      task: {
        id: `t-${Date.now()}`,
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || undefined,
        assignee: form.assignee || undefined,
        opportunityId: form.opportunityId || undefined,
        createdAt: Date.now(),
      },
    });
    onClose();
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 13,
    padding: '8px 10px', outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };

  return (
    <form onSubmit={submit} style={{ padding: '16px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', marginBottom: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>New Task</div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" autoFocus />
        </div>

        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional context..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Priority</label>
            <select style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
              {(['Low', 'Medium', 'High', 'Critical'] as TaskPriority[]).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
              {(['To do', 'In progress', 'Done', 'Blocked'] as TaskStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" style={inputStyle} value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Assignee</label>
            <input style={inputStyle} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Name" />
          </div>
        </div>

        {account.opportunities.length > 0 && (
          <div>
            <label style={labelStyle}>Link to Opportunity</label>
            <select style={inputStyle} value={form.opportunityId} onChange={e => setForm(f => ({ ...f, opportunityId: e.target.value }))}>
              <option value="">General (no opportunity)</option>
              {account.opportunities.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="submit" style={{ padding: '7px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          Add Task
        </button>
        <button type="button" onClick={onClose} style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 12, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function TasksTab({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const [adding,      setAdding]      = useState(false);
  const [filter,      setFilter]      = useState<'All' | TaskStatus>('All');
  const [drawerTask,  setDrawerTask]  = useState<DrawerTask | null>(null);

  function openDrawer(task: Task) {
    const opp = task.opportunityId ? account.opportunities.find(o => o.id === task.opportunityId) : undefined;
    setDrawerTask({ ...task, accountId: account.id, accountName: account.name, opportunityName: opp?.name });
  }

  const tasks = account.tasks
    .filter(t => filter === 'All' || t.status === filter)
    .sort((a, b) => {
      const pri = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return pri[a.priority] - pri[b.priority];
    });

  const general = tasks.filter(t => !t.opportunityId);
  const byOpp = account.opportunities.map(opp => ({
    opp,
    tasks: tasks.filter(t => t.opportunityId === opp.id),
  })).filter(g => g.tasks.length > 0);

  function cycleStatus(task: Task) {
    const order: TaskStatus[] = ['To do', 'In progress', 'Done', 'Blocked'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    dispatch({ type: 'UPDATE_TASK', accountId: account.id, task: { ...task, status: next } });
  }

  function renderTask(task: Task) {
    const overdue = isOverdue(task.dueDate, task.status);
    return (
      <div key={task.id}
        onClick={() => openDrawer(task)}
        style={{
          padding: '10px 12px',
          background: 'var(--bg3)',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border)',
          marginBottom: 6,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
      >
        {/* status dot / click to cycle */}
        <button
          onClick={e => { e.stopPropagation(); cycleStatus(task); }}
          title={`Status: ${task.status} — click to advance`}
          style={{
            width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 2,
            background: task.status === 'Done' ? 'var(--green)' : 'transparent',
            border: `2px solid ${STATUS_COLOR[task.status]}`,
            cursor: 'pointer',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500,
            color: task.status === 'Done' ? 'var(--text3)' : 'var(--text)',
            textDecoration: task.status === 'Done' ? 'line-through' : 'none',
            marginBottom: 3,
          }}>
            {task.title}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{task.description}</div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
              color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority],
            }}>
              {task.priority}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99,
              color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '18',
            }}>
              {task.status}
            </span>
            {task.dueDate && (
              <span style={{ fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
                {overdue ? '⚠ ' : ''}{fmt(task.dueDate)}
              </span>
            )}
            {task.assignee && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>→ {task.assignee}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filterBtnStyle = (active: boolean) => ({
    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer',
    background: active ? 'var(--bg4)' : 'transparent',
    border: active ? '1px solid var(--border2)' : '1px solid transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['All', 'To do', 'In progress', 'Blocked', 'Done'] as const).map(s => (
            <button key={s} style={filterBtnStyle(filter === s)} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          style={{ padding: '6px 12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          + Add Task
        </button>
      </div>

      {adding && <AddTaskForm account={account} onClose={() => setAdding(false)} />}

      {tasks.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
          No tasks match this filter.
        </div>
      )}

      {byOpp.map(({ opp, tasks: oppTasks }) => (
        <div key={opp.id} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent)', fontSize: 10 }}>●</span>
            {opp.name}
            <span style={{ fontWeight: 400, color: 'var(--text3)' }}>— {oppTasks.length} task{oppTasks.length !== 1 ? 's' : ''}</span>
          </div>
          {oppTasks.map(renderTask)}
        </div>
      ))}

      {general.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            General
          </div>
          {general.map(renderTask)}
        </div>
      )}

      {drawerTask && (
        <TaskDetailDrawer
          task={drawerTask}
          onClose={() => setDrawerTask(null)}
        />
      )}
    </div>
  );
}
