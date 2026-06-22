'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { useConfig } from '@/context/ConfigContext';
import { useToast } from '@/context/ToastContext';
import { TaskPriority, TaskStatus } from '@/lib/crmTypes';
import { TaskKanban } from './TaskKanban';
import { TaskList } from './TaskList';
import { TaskDetailDrawer, DrawerTask } from './TaskDetailDrawer';
import { AssigneeAutocomplete } from './AssigneeAutocomplete';

const STATUS_ORDER: TaskStatus[] = ['To do', 'In progress', 'Done', 'Blocked'];

function NewTaskModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCrm();
  const { config } = useConfig();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', status: 'To do' as TaskStatus, priority: 'Medium' as TaskPriority, dueDate: '', assignee: '' });
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 'var(--r-sm)', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    dispatch({ type: 'ADD_DEPT_TASK', task: { id: `t-${Date.now()}`, title: form.title.trim(), description: form.description.trim() || undefined, status: form.status, priority: form.priority, dueDate: form.dueDate || undefined, assignee: form.assignee || undefined, createdAt: Date.now(), comments: [] } });
    toast('Task added');
    onClose();
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 480, maxWidth: '90vw', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>New Task</div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div><label style={lbl}>Title *</label><input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" autoFocus /></div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
            <div><label style={lbl}>Due Date</label><input type="date" style={inp} value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div><label style={lbl}>Assignee</label>
              <AssigneeAutocomplete value={form.assignee} onChange={v => setForm(f => ({ ...f, assignee: v }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Add Task</button>
            <button type="button" onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

type ViewMode = 'kanban' | 'list';

const KanbanIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
    <rect x="1" y="1" width="3" height="12" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="5.5" y="1" width="3" height="9" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="10" y="1" width="3" height="11" rx="1" fill="currentColor" opacity="0.9"/>
  </svg>
);

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
    <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor"/>
    <rect x="1" y="5.5" width="12" height="1.5" rx="0.75" fill="currentColor"/>
    <rect x="1" y="9" width="12" height="1.5" rx="0.75" fill="currentColor"/>
    <rect x="1" y="12" width="8" height="1.5" rx="0.75" fill="currentColor"/>
  </svg>
);

export function TasksView() {
  const { state } = useCrm();
  const { config } = useConfig();
  const [view,       setView]       = useState<ViewMode>('kanban');
  const [newTask,    setNewTask]    = useState(false);
  const [search,     setSearch]     = useState('');
  const fAccount = '';
  const [drawerTask, setDrawerTask] = useState<DrawerTask | null>(null);
  const [fPriority, setFPriority] = useState('');
  const [fAssignee, setFAssignee] = useState('');

  const [fDue, setFDue] = useState('');

  const allAssignees = config.teamMembers;

  const hasFilters = !!(search || fPriority || fAssignee || fDue);

  function clearAll() {
    setSearch(''); setFPriority(''); setFAssignee(''); setFDue('');
  }

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px', fontSize: 12, fontWeight: 500,
    background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text2)', cursor: 'pointer', outline: 'none',
  };

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 'var(--r-sm)', cursor: 'pointer',
    background: active ? 'var(--bg4)' : 'transparent',
    border: active ? '1px solid var(--border2)' : '1px solid transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Shared filter bar */}
      <div style={{
        padding: '10px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 9, pointerEvents: 'none', color: 'var(--text3)' }}>
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              ...selectStyle, paddingLeft: 28, width: 180,
              background: 'var(--bg2)',
            }}
          />
        </div>

        <select style={selectStyle} value={fPriority} onChange={e => setFPriority(e.target.value)}>
          <option value="">All priorities</option>
          {(['Critical', 'High', 'Medium', 'Low'] as TaskPriority[]).map(p =>
            <option key={p} value={p}>{p}</option>)}
        </select>

        <select style={selectStyle} value={fAssignee} onChange={e => setFAssignee(e.target.value)}>
          <option value="">All assignees</option>
          {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <select style={selectStyle} value={fDue} onChange={e => setFDue(e.target.value)}>
          <option value="">All due dates</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due this week</option>
        </select>

        {hasFilters && (
          <button onClick={clearAll}
            style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px' }}>
            Clear all
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={() => setNewTask(true)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 300, lineHeight: 1 }}>+</span> New Task
        </button>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button style={viewBtnStyle(view === 'kanban')} onClick={() => setView('kanban')} title="Kanban view">
            <KanbanIcon />
          </button>
          <button style={viewBtnStyle(view === 'list')} onClick={() => setView('list')} title="List view">
            <ListIcon />
          </button>
        </div>
      </div>

      {view === 'kanban'
        ? <TaskKanban fAccount={fAccount} fPriority={fPriority} fAssignee={fAssignee} fDue={fDue} onTaskClick={setDrawerTask} />
        : <TaskList search={search} fAccount={fAccount} fPriority={fPriority} fAssignee={fAssignee} fDue={fDue} onTaskClick={setDrawerTask} />
      }

      {drawerTask && <TaskDetailDrawer task={drawerTask} onClose={() => setDrawerTask(null)} />}
      {newTask && <NewTaskModal onClose={() => setNewTask(false)} />}
    </div>
  );
}
