'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { TaskPriority } from '@/lib/crmTypes';
import { TaskKanban } from './TaskKanban';
import { TaskList } from './TaskList';
import { TaskDetailDrawer, DrawerTask } from './TaskDetailDrawer';

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
  const [view,       setView]       = useState<ViewMode>('kanban');
  const [search,     setSearch]     = useState('');
  const [fAccount,   setFAccount]   = useState('');
  const [drawerTask, setDrawerTask] = useState<DrawerTask | null>(null);
  const [fPriority, setFPriority] = useState('');
  const [fAssignee, setFAssignee] = useState('');

  const allAssignees = [...new Set(
    state.accounts.flatMap(a => a.tasks.map(t => t.assignee).filter(Boolean) as string[])
  )].sort();

  const hasFilters = !!(search || fAccount || fPriority || fAssignee);

  function clearAll() {
    setSearch(''); setFAccount(''); setFPriority(''); setFAssignee('');
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Shared filter bar */}
      <div style={{
        padding: '10px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ position: 'absolute', left: 9, pointerEvents: 'none', color: 'var(--text3)' }}>
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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

        <select style={selectStyle} value={fAccount} onChange={e => setFAccount(e.target.value)}>
          <option value="">All accounts</option>
          {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select style={selectStyle} value={fPriority} onChange={e => setFPriority(e.target.value)}>
          <option value="">All priorities</option>
          {(['Critical', 'High', 'Medium', 'Low'] as TaskPriority[]).map(p =>
            <option key={p} value={p}>{p}</option>)}
        </select>

        <select style={selectStyle} value={fAssignee} onChange={e => setFAssignee(e.target.value)}>
          <option value="">All assignees</option>
          {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {hasFilters && (
          <button onClick={clearAll}
            style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px' }}>
            Clear all
          </button>
        )}

        <div style={{ flex: 1 }} />

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
        ? <TaskKanban fAccount={fAccount} fPriority={fPriority} fAssignee={fAssignee} onTaskClick={setDrawerTask} />
        : <TaskList search={search} fAccount={fAccount} fPriority={fPriority} fAssignee={fAssignee} onTaskClick={setDrawerTask} />
      }

      {drawerTask && <TaskDetailDrawer task={drawerTask} onClose={() => setDrawerTask(null)} />}
    </div>
  );
}
