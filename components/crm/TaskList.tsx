'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { TaskStatus, TaskPriority } from '@/lib/crmTypes';

const STATUS_COLOR: Record<TaskStatus, string> = {
  'To do':       'var(--text3)',
  'In progress': 'var(--blue)',
  'Blocked':     'var(--red)',
  'Done':        'var(--green)',
};
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  Low: 'var(--text3)', Medium: 'var(--amber)', High: 'var(--accent)', Critical: 'var(--red)',
};
const PRIORITY_BG: Record<TaskPriority, string> = {
  Low: 'transparent', Medium: 'var(--amber-dim)', High: 'var(--accent-dim)', Critical: 'var(--red-dim)',
};
const PRIORITY_RANK: Record<TaskPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

type SortKey = 'priority' | 'dueDate' | 'account' | 'status' | 'assignee';

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}
function isOverdue(iso?: string, status?: TaskStatus) {
  if (!iso || status === 'Done') return false;
  return new Date(iso) < new Date();
}

interface Props {
  fAccount: string;
  fPriority: string;
  fAssignee: string;
}

export function TaskList({ fAccount, fPriority, fAssignee }: Props) {
  const { state, dispatch } = useCrm();
  const [sortKey, setSortKey]   = useState<SortKey>('priority');
  const [sortAsc, setSortAsc]   = useState(true);
  const [groupBy, setGroupBy]   = useState<'none' | 'status' | 'account'>('status');

  const allTasks = state.accounts.flatMap(acc =>
    acc.tasks.map(t => ({
      ...t,
      accountId: acc.id,
      accountName: acc.name,
      opportunityName: t.opportunityId
        ? acc.opportunities.find(o => o.id === t.opportunityId)?.name
        : undefined,
    }))
  ).filter(t =>
    (!fAccount  || t.accountId === fAccount) &&
    (!fPriority || t.priority  === fPriority) &&
    (!fAssignee || t.assignee  === fAssignee)
  );

  function sort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function sorted<T extends typeof allTasks[0]>(arr: T[]) {
    return [...arr].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority') cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sortKey === 'dueDate')  cmp = (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
      if (sortKey === 'account')  cmp = a.accountName.localeCompare(b.accountName);
      if (sortKey === 'status')   cmp = a.status.localeCompare(b.status);
      if (sortKey === 'assignee') cmp = (a.assignee ?? '').localeCompare(b.assignee ?? '');
      return sortAsc ? cmp : -cmp;
    });
  }

  function cycleStatus(task: typeof allTasks[0]) {
    const order: TaskStatus[] = ['To do', 'In progress', 'Blocked', 'Done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, status: next } });
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7 }}>{sortAsc ? '▲' : '▼'}</span>
      : <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.25 }}>▲</span>;

  const thStyle: React.CSSProperties = {
    padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em',
    background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
    position: 'sticky', top: 0, zIndex: 1,
  };

  function renderRows(tasks: typeof allTasks) {
    return sorted(tasks).map(task => {
      const overdue = isOverdue(task.dueDate, task.status);
      const done    = task.status === 'Done';
      return (
        <tr key={task.id} style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Status dot */}
          <td style={{ padding: '10px 12px', width: 36 }}>
            <button
              onClick={() => cycleStatus(task)}
              title={`${task.status} — click to advance`}
              style={{
                width: 14, height: 14, borderRadius: '50%', cursor: 'pointer', padding: 0,
                background: done ? 'var(--green)' : 'transparent',
                border: `2px solid ${STATUS_COLOR[task.status]}`,
              }}
            />
          </td>

          {/* Title */}
          <td style={{ padding: '10px 8px', minWidth: 200 }}>
            <span style={{
              fontSize: 13, fontWeight: 500, color: done ? 'var(--text3)' : 'var(--text)',
              textDecoration: done ? 'line-through' : 'none',
            }}>
              {task.title}
            </span>
            {task.opportunityName && (
              <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontWeight: 600 }}>
                ● {task.opportunityName}
              </div>
            )}
          </td>

          {/* Account */}
          <td style={{ padding: '10px 8px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
            {task.accountName}
          </td>

          {/* Priority */}
          <td style={{ padding: '10px 8px' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
              color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority],
              border: `1px solid ${PRIORITY_COLOR[task.priority]}33`,
            }}>
              {task.priority}
            </span>
          </td>

          {/* Status */}
          <td style={{ padding: '10px 8px' }}>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
              color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '18',
            }}>
              {task.status}
            </span>
          </td>

          {/* Due date */}
          <td style={{ padding: '10px 8px', fontSize: 12, whiteSpace: 'nowrap', color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400 }}>
            {overdue ? '⚠ ' : ''}{fmtDate(task.dueDate)}
          </td>

          {/* Assignee */}
          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
            {task.assignee ?? '—'}
          </td>
        </tr>
      );
    });
  }

  // Group headers
  function renderGrouped() {
    if (groupBy === 'none') {
      return renderRows(allTasks);
    }
    const groups: { label: string; color: string; tasks: typeof allTasks }[] = [];
    if (groupBy === 'status') {
      const statuses: TaskStatus[] = ['In progress', 'Blocked', 'To do', 'Done'];
      statuses.forEach(s => {
        const tasks = allTasks.filter(t => t.status === s);
        if (tasks.length) groups.push({ label: s, color: STATUS_COLOR[s], tasks });
      });
    } else {
      state.accounts.forEach(acc => {
        const tasks = allTasks.filter(t => t.accountId === acc.id);
        if (tasks.length) groups.push({ label: acc.name, color: 'var(--text2)', tasks });
      });
    }
    return groups.map(g => (
      <>
        <tr key={g.label + '-header'}>
          <td colSpan={7} style={{
            padding: '8px 12px', background: 'var(--bg3)',
            borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, display: 'inline-block', marginRight: 7, verticalAlign: 'middle' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{g.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>{g.tasks.length}</span>
          </td>
        </tr>
        {renderRows(g.tasks)}
      </>
    ));
  }

  const groupBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 99,
    background: active ? 'var(--bg4)' : 'transparent',
    border: active ? '1px solid var(--border2)' : '1px solid transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sub-toolbar */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>Group by</span>
        <button style={groupBtnStyle(groupBy === 'status')}  onClick={() => setGroupBy('status')}>Status</button>
        <button style={groupBtnStyle(groupBy === 'account')} onClick={() => setGroupBy('account')}>Account</button>
        <button style={groupBtnStyle(groupBy === 'none')}    onClick={() => setGroupBy('none')}>None</button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{allTasks.length} task{allTasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 36 }} />
              <th style={thStyle} onClick={() => sort('status')}>Task <SortIcon k="status" /></th>
              <th style={thStyle} onClick={() => sort('account')}>Account <SortIcon k="account" /></th>
              <th style={thStyle} onClick={() => sort('priority')}>Priority <SortIcon k="priority" /></th>
              <th style={thStyle} onClick={() => sort('status')}>Status <SortIcon k="status" /></th>
              <th style={thStyle} onClick={() => sort('dueDate')}>Due <SortIcon k="dueDate" /></th>
              <th style={thStyle} onClick={() => sort('assignee')}>Assignee <SortIcon k="assignee" /></th>
            </tr>
          </thead>
          <tbody>
            {renderGrouped()}
          </tbody>
        </table>

        {allTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontSize: 13 }}>
            No tasks match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
