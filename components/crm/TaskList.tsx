'use client';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { useCrm } from '@/context/CrmContext';
import { useConfig } from '@/context/ConfigContext';
import { useToast } from '@/context/ToastContext';
import { TaskStatus, TaskPriority } from '@/lib/crmTypes';

const STATUS_COLOR: Record<TaskStatus, string> = {
  'To do': 'var(--text3)', 'In progress': 'var(--blue)', 'Blocked': 'var(--red)', 'Done': 'var(--green)',
};
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  Low: 'var(--text3)', Medium: 'var(--amber)', High: 'var(--accent)', Critical: 'var(--red)',
};
const PRIORITY_BG: Record<TaskPriority, string> = {
  Low: 'transparent', Medium: 'var(--amber-dim)', High: 'var(--accent-dim)', Critical: 'var(--red-dim)',
};
const PRIORITY_RANK: Record<TaskPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

type SortKey = 'title' | 'priority' | 'dueDate' | 'account' | 'status' | 'assignee';
type GroupBy  = 'status' | 'account' | 'none';
const PAGE_SIZE = 10;

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}
function isOverdue(iso?: string, status?: TaskStatus) {
  if (!iso || status === 'Done') return false;
  return new Date(iso) < new Date();
}

import { DrawerTask } from './TaskDetailDrawer';

const STATUSES: TaskStatus[] = ['To do', 'In progress', 'Done', 'Blocked'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

function EditTaskModal({ task, onClose }: { task: FlatTask; onClose: () => void }) {
  const { dispatch } = useCrm();
  const { config } = useConfig();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: task.title, description: task.description ?? '', status: task.status, priority: task.priority, dueDate: task.dueDate ?? '', assignee: task.assignee ?? '' });
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 'var(--r-sm)', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' };
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { id: task.id, createdAt: task.createdAt, comments: task.comments, opportunityId: task.opportunityId, title: form.title.trim(), description: form.description.trim() || undefined, status: form.status, priority: form.priority, dueDate: form.dueDate || undefined, assignee: form.assignee || undefined } });
    toast('Task updated');
    onClose();
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 800 }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 801, background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 480, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Edit Task</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text3)', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          <div><label style={lbl}>Title *</label><input style={{ ...inp, fontWeight: 600 }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Status</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Priority</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Due Date</label><input type="date" style={inp} value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div><label style={lbl}>Assignee</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                <option value="">Unassigned</option>
                {config.teamMembers.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 72, lineHeight: 1.55 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save</button>
            <button type="button" onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

interface Props { search: string; fAccount: string; fPriority: string; fAssignee: string; onTaskClick?: (t: DrawerTask) => void; }

type FlatTask = { id: string; accountId: string; accountName: string; title: string; description?: string; status: TaskStatus; priority: TaskPriority; dueDate?: string; assignee?: string; opportunityId?: string; opportunityName?: string; comments: import('@/lib/crmTypes').Comment[]; createdAt: number; };

export function TaskList({ search, fAccount, fPriority, fAssignee, onTaskClick }: Props) {
  const { state, dispatch } = useCrm();
  const [editTask, setEditTask] = useState<FlatTask | null>(null);
  const [delTask,  setDelTask]  = useState<FlatTask | null>(null);

  const [sortKey,   setSortKey]   = useState<SortKey>('priority');
  const [sortAsc,   setSortAsc]   = useState(true);
  const [groupBy,   setGroupBy]   = useState<GroupBy>('status');
  const [page,      setPage]      = useState(1);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allTasks = useMemo<FlatTask[]>(() =>
    state.accounts.flatMap(acc =>
      acc.tasks.map(t => ({
        ...t,
        accountId: acc.id,
        accountName: acc.name,
        opportunityName: t.opportunityId
          ? acc.opportunities.find(o => o.id === t.opportunityId)?.name
          : undefined,
      }))
    ).filter(t => {
      if (fAccount  && t.accountId !== fAccount)  return false;
      if (fPriority && t.priority  !== fPriority) return false;
      if (fAssignee && t.assignee  !== fAssignee) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.accountName.toLowerCase().includes(q) ||
          (t.assignee ?? '').toLowerCase().includes(q) ||
          (t.opportunityName ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    }),
    [state.accounts, fAccount, fPriority, fAssignee, search]
  );

  const sorted = useMemo(() =>
    [...allTasks].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title')    cmp = a.title.localeCompare(b.title);
      if (sortKey === 'priority') cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sortKey === 'dueDate')  cmp = (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
      if (sortKey === 'account')  cmp = a.accountName.localeCompare(b.accountName);
      if (sortKey === 'status')   cmp = a.status.localeCompare(b.status);
      if (sortKey === 'assignee') cmp = (a.assignee ?? '').localeCompare(b.assignee ?? '');
      return sortAsc ? cmp : -cmp;
    }),
    [allTasks, sortKey, sortAsc]
  );

  // Pagination only applies in ungrouped mode
  const totalPages = groupBy === 'none' ? Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)) : 1;
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageEnd    = pageStart + PAGE_SIZE;
  const pageTasks  = groupBy === 'none' ? sorted.slice(pageStart, pageEnd) : sorted;

  useEffect(() => { setPage(1); }, [fAccount, fPriority, fAssignee, search, groupBy, sortKey]);

  const groups = useMemo(() => {
    if (groupBy === 'status') {
      return (['To do', 'In progress', 'Done', 'Blocked'] as TaskStatus[])
        .map(s => ({ key: s, label: s, color: STATUS_COLOR[s], tasks: sorted.filter(t => t.status === s) }))
        .filter(g => g.tasks.length > 0);
    }
    if (groupBy === 'account') {
      return state.accounts
        .map(acc => ({ key: acc.id, label: acc.name, color: 'var(--text2)', tasks: sorted.filter(t => t.accountId === acc.id) }))
        .filter(g => g.tasks.length > 0);
    }
    return [];
  }, [groupBy, sorted, state.accounts]);

  function changeSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }
  function toggleGroup(label: string) {
    setCollapsed(prev => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });
  }
  function cycleStatus(task: FlatTask) {
    const order: TaskStatus[] = ['To do', 'In progress', 'Blocked', 'Done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { id: task.id, createdAt: task.createdAt, comments: task.comments, opportunityId: task.opportunityId, title: task.title, description: task.description, status: next, priority: task.priority, dueDate: task.dueDate, assignee: task.assignee } });
  }

  // ── Shared styles ────────────────────────────────────────────────
  const thStyle: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em',
    background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
    position: 'sticky', top: 0, zIndex: 1,
  };
  const SortArrow = ({ k }: { k: SortKey }) => (
    <span style={{ marginLeft: 4, fontSize: 9, opacity: sortKey === k ? 0.7 : 0.2 }}>
      {sortKey === k ? (sortAsc ? '▲' : '▼') : '▲'}
    </span>
  );
  const groupBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 99,
    background: active ? 'var(--bg4)' : 'transparent',
    border: active ? '1px solid var(--border2)' : '1px solid transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
  });
  const pgBtnStyle = (active: boolean, disabled = false): React.CSSProperties => ({
    minWidth: 30, height: 30, padding: '0 6px', borderRadius: 'var(--r-xs)',
    fontSize: 12, fontWeight: active ? 700 : 400, cursor: disabled ? 'default' : 'pointer',
    background: active ? 'var(--accent)' : 'transparent',
    border: active ? 'none' : '1px solid transparent',
    color: active ? '#000' : disabled ? 'var(--text3)' : 'var(--text2)',
    opacity: disabled ? 0.4 : 1,
  });

  // ── Inline row renderer (plain function returning JSX, not a component) ──
  function rowJsx(task: FlatTask) {
    const overdue = isOverdue(task.dueDate, task.status);
    return (
      <tr key={task.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
        onClick={() => onTaskClick?.(task as DrawerTask)}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
        {/* Edit + Delete — first column */}
        <td style={{ padding: '6px 8px', width: 68, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={e => { e.stopPropagation(); setEditTask(task); }} title="Edit task"
              style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text2)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--accent)'; b.style.borderColor = 'var(--accent)'; b.style.background = 'var(--accent-dim)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text2)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={e => { e.stopPropagation(); setDelTask(task); }} title="Delete task"
              style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--red)'; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </td>
        <td style={{ padding: '10px 8px', minWidth: 200 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
            {task.title}
          </span>
          {task.opportunityName && (
            <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontWeight: 600 }}>● {task.opportunityName}</div>
          )}
        </td>
        <td style={{ padding: '10px 8px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{task.accountName}</td>
        <td style={{ padding: '10px 8px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority],
            border: `1px solid ${PRIORITY_COLOR[task.priority]}33` }}>
            {task.priority}
          </span>
        </td>
        <td style={{ padding: '6px 8px' }} onClick={e => e.stopPropagation()}>
          <select
            className="select-badge"
            value={task.status}
            onChange={e => dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { id: task.id, createdAt: task.createdAt, comments: task.comments, opportunityId: task.opportunityId, title: task.title, description: task.description, status: e.target.value as TaskStatus, priority: task.priority, dueDate: task.dueDate, assignee: task.assignee } })}
            style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99, border: `1px solid ${STATUS_COLOR[task.status]}40`, background: STATUS_COLOR[task.status] + '18', color: STATUS_COLOR[task.status], cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'inherit' }}>
            {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--bg2)', color: 'var(--text)' }}>{s}</option>)}
          </select>
        </td>
        <td style={{ padding: '10px 8px', fontSize: 12, whiteSpace: 'nowrap',
          color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400 }}>
          {overdue ? '⚠ ' : ''}{fmtDate(task.dueDate)}
        </td>
        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {task.assignee ?? '—'}
        </td>
        <td style={{ padding: '10px 12px', maxWidth: 220 }}>
          {task.comments && task.comments.length > 0 ? (() => {
            const last = task.comments[task.comments.length - 1];
            return (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  background: `hsl(${last.author.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360},50%,48%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: '#fff',
                }}>
                  {last.author.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                    {last.text}
                  </div>
                  {task.comments.length > 1 && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', opacity: 0.6 }}>+{task.comments.length - 1} more</div>
                  )}
                </div>
              </div>
            );
          })() : (
            <span style={{ fontSize: 11, color: 'var(--text3)', opacity: 0.4 }}>—</span>
          )}
        </td>
      </tr>
    );
  }

  function groupHeaderJsx(g: typeof groups[0]) {
    const isCollapsed = collapsed.has(g.label);
    return (
      <tr key={g.key + '-hdr'}>
        <td colSpan={9} style={{ padding: 0, background: 'var(--bg3)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => toggleGroup(g.label)}
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ color: 'var(--text3)', flexShrink: 0, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{g.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {g.tasks.length} task{g.tasks.length !== 1 ? 's' : ''}
            </span>
          </button>
        </td>
      </tr>
    );
  }

  // pageNums for pagination bar
  function pageNums() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1 as number | '…');
    const pages: (number | '…')[] = [1];
    if (safePage > 3) pages.push('…');
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
    if (safePage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sub-toolbar */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 2 }}>Group by</span>
        <button style={groupBtnStyle(groupBy === 'status')}  onClick={() => { setGroupBy('status');  setCollapsed(new Set()); }}>Status</button>
        <button style={groupBtnStyle(groupBy === 'account')} onClick={() => { setGroupBy('account'); setCollapsed(new Set()); }}>Account</button>
        <button style={groupBtnStyle(groupBy === 'none')}    onClick={() => { setGroupBy('none');    setCollapsed(new Set()); }}>None</button>
        {groupBy !== 'none' && (() => {
          const allKeys = groupBy === 'status' ? ['To do', 'In progress', 'Done', 'Blocked'] : state.accounts.map(a => a.name);
          const allCollapsed = allKeys.every(k => collapsed.has(k));
          return (
            <>
              <span style={{ width: 1, height: 14, background: 'var(--border2)', margin: '0 4px' }} />
              <button
                onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(allKeys))}
                style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px' }}>
                {allCollapsed ? 'Expand all' : 'Collapse all'}
              </button>
            </>
          );
        })()}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
          {sorted.length > 0
            ? groupBy === 'none'
              ? `${pageStart + 1}–${Math.min(pageEnd, sorted.length)} of ${sorted.length} task${sorted.length !== 1 ? 's' : ''}`
              : `${sorted.length} task${sorted.length !== 1 ? 's' : ''}`
            : '0 tasks'}
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 68, cursor: 'default' }} />
              <th style={thStyle} onClick={() => changeSort('title')}>Task <SortArrow k="title" /></th>
              <th style={thStyle} onClick={() => changeSort('account')}>Account <SortArrow k="account" /></th>
              <th style={thStyle} onClick={() => changeSort('priority')}>Priority <SortArrow k="priority" /></th>
              <th style={thStyle} onClick={() => changeSort('status')}>Status <SortArrow k="status" /></th>
              <th style={thStyle} onClick={() => changeSort('dueDate')}>Due <SortArrow k="dueDate" /></th>
              <th style={thStyle} onClick={() => changeSort('assignee')}>Assignee <SortArrow k="assignee" /></th>
              <th style={{ ...thStyle, cursor: 'default' }}>Last comment</th>
            </tr>
          </thead>
          <tbody>
            {groupBy === 'none'
              ? pageTasks.map(rowJsx)
              : groups.map(g => (
                  <Fragment key={g.key}>
                    {groupHeaderJsx(g)}
                    {!collapsed.has(g.label) && g.tasks.map(rowJsx)}
                  </Fragment>
                ))
            }
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontSize: 13 }}>
            No tasks match the current filters.
          </div>
        )}
      </div>

      {editTask && <EditTaskModal task={editTask} onClose={() => setEditTask(null)} />}

      {delTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDelTask(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete task?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>"{delTask.title}"</strong> will be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelTask(null)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
              <button onClick={() => { dispatch({ type: 'DELETE_TASK', accountId: delTask.accountId, taskId: delTask.id }); setDelTask(null); }} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination — only in ungrouped mode */}
      {groupBy === 'none' && totalPages > 1 && (
        <div style={{ padding: '10px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button style={pgBtnStyle(false, safePage === 1)} disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>
            ‹ Prev
          </button>
          {pageNums().map((n, i) =>
            n === '…'
              ? <span key={`el-${i}`} style={{ padding: '0 4px', color: 'var(--text3)', fontSize: 12 }}>…</span>
              : <button key={n} style={pgBtnStyle(n === safePage)} onClick={() => setPage(n as number)}>{n}</button>
          )}
          <button style={pgBtnStyle(false, safePage === totalPages)} disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
