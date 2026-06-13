'use client';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { useCrm } from '@/context/CrmContext';
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

interface Props { search: string; fAccount: string; fPriority: string; fAssignee: string; }

export function TaskList({ search, fAccount, fPriority, fAssignee }: Props) {
  const { state, dispatch } = useCrm();

  const [sortKey,   setSortKey]   = useState<SortKey>('priority');
  const [sortAsc,   setSortAsc]   = useState(true);
  const [groupBy,   setGroupBy]   = useState<GroupBy>('status');
  const [page,      setPage]      = useState(1);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['To do', 'In progress', 'Done', 'Blocked']));

  const allTasks = useMemo(() =>
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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pageEnd    = pageStart + PAGE_SIZE;
  const pageTasks  = sorted.slice(pageStart, pageEnd);
  const pageIds    = useMemo(() => new Set(pageTasks.map(t => t.id)), [pageTasks]);

  useEffect(() => { setPage(1); }, [fAccount, fPriority, fAssignee, search, groupBy, sortKey]);

  const groups = useMemo(() => {
    if (groupBy === 'status') {
      return (['To do', 'In progress', 'Done', 'Blocked'] as TaskStatus[])
        .map(s => ({
          key: s, label: s, color: STATUS_COLOR[s],
          allTasks: sorted.filter(t => t.status === s),
          pageTasks: sorted.filter(t => t.status === s && pageIds.has(t.id)),
        }))
        .filter(g => g.allTasks.length > 0);
    }
    if (groupBy === 'account') {
      return state.accounts
        .map(acc => ({
          key: acc.id, label: acc.name, color: 'var(--text2)',
          allTasks: sorted.filter(t => t.accountId === acc.id),
          pageTasks: sorted.filter(t => t.accountId === acc.id && pageIds.has(t.id)),
        }))
        .filter(g => g.allTasks.length > 0);
    }
    return [];
  }, [groupBy, sorted, pageIds, state.accounts]);

  function changeSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }
  function toggleGroup(label: string) {
    setCollapsed(prev => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });
  }
  function cycleStatus(task: typeof allTasks[0]) {
    const order: TaskStatus[] = ['To do', 'In progress', 'Blocked', 'Done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, status: next } });
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
  function rowJsx(task: typeof allTasks[0]) {
    const overdue = isOverdue(task.dueDate, task.status);
    const done    = task.status === 'Done';
    return (
      <tr key={task.id} style={{ borderBottom: '1px solid var(--border)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
        <td style={{ padding: '10px 12px', width: 36 }}>
          <button onClick={() => cycleStatus(task)} title={`${task.status} — click to advance`}
            style={{ width: 14, height: 14, borderRadius: '50%', cursor: 'pointer', padding: 0,
              background: done ? 'var(--green)' : 'transparent',
              border: `2px solid ${STATUS_COLOR[task.status]}` }} />
        </td>
        <td style={{ padding: '10px 8px', minWidth: 200 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: done ? 'var(--text3)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
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
        <td style={{ padding: '10px 8px' }}>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
            color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '18' }}>
            {task.status}
          </span>
        </td>
        <td style={{ padding: '10px 8px', fontSize: 12, whiteSpace: 'nowrap',
          color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400 }}>
          {overdue ? '⚠ ' : ''}{fmtDate(task.dueDate)}
        </td>
        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {task.assignee ?? '—'}
        </td>
      </tr>
    );
  }

  function groupHeaderJsx(g: typeof groups[0]) {
    const isCollapsed = collapsed.has(g.label);
    return (
      <tr key={g.key + '-hdr'}>
        <td colSpan={7} style={{ padding: 0, background: 'var(--bg3)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => toggleGroup(g.label)}
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
              style={{ color: 'var(--text3)', flexShrink: 0, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{g.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {isCollapsed ? `${g.allTasks.length} task${g.allTasks.length !== 1 ? 's' : ''}` : `${g.pageTasks.length} of ${g.allTasks.length}`}
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
        <button style={groupBtnStyle(groupBy === 'status')}  onClick={() => setGroupBy('status')}>Status</button>
        <button style={groupBtnStyle(groupBy === 'account')} onClick={() => setGroupBy('account')}>Account</button>
        <button style={groupBtnStyle(groupBy === 'none')}    onClick={() => setGroupBy('none')}>None</button>
        {groupBy !== 'none' && (
          <>
            <span style={{ width: 1, height: 14, background: 'var(--border2)', margin: '0 4px' }} />
            <button onClick={() => setCollapsed(new Set())}
              style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px' }}>
              Expand all
            </button>
            <button onClick={() => setCollapsed(new Set(
                groupBy === 'status' ? ['To do', 'In progress', 'Done', 'Blocked'] : state.accounts.map(a => a.name)
              ))}
              style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px' }}>
              Collapse all
            </button>
          </>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
          {sorted.length > 0
            ? `${pageStart + 1}–${Math.min(pageEnd, sorted.length)} of ${sorted.length} task${sorted.length !== 1 ? 's' : ''}`
            : '0 tasks'}
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36, cursor: 'default' }} />
              <th style={thStyle} onClick={() => changeSort('title')}>Task <SortArrow k="title" /></th>
              <th style={thStyle} onClick={() => changeSort('account')}>Account <SortArrow k="account" /></th>
              <th style={thStyle} onClick={() => changeSort('priority')}>Priority <SortArrow k="priority" /></th>
              <th style={thStyle} onClick={() => changeSort('status')}>Status <SortArrow k="status" /></th>
              <th style={thStyle} onClick={() => changeSort('dueDate')}>Due <SortArrow k="dueDate" /></th>
              <th style={thStyle} onClick={() => changeSort('assignee')}>Assignee <SortArrow k="assignee" /></th>
            </tr>
          </thead>
          <tbody>
            {groupBy === 'none'
              ? pageTasks.map(rowJsx)
              : groups.map(g => (
                  <Fragment key={g.key}>
                    {groupHeaderJsx(g)}
                    {!collapsed.has(g.label) && g.pageTasks.map(rowJsx)}
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

      {/* Pagination */}
      {totalPages > 1 && (
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
