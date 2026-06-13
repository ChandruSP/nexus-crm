'use client';
import { useState, useMemo } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Task, TaskStatus, TaskPriority } from '@/lib/crmTypes';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'To do',      label: 'To do',       color: 'var(--text3)' },
  { status: 'In progress', label: 'In progress', color: 'var(--blue)' },
  { status: 'Blocked',    label: 'Blocked',      color: 'var(--red)' },
  { status: 'Done',       label: 'Done',         color: 'var(--green)' },
];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  Low:      'var(--text3)',
  Medium:   'var(--amber)',
  High:     'var(--accent)',
  Critical: 'var(--red)',
};

const PRIORITY_BG: Record<TaskPriority, string> = {
  Low:      'transparent',
  Medium:   'var(--amber-dim)',
  High:     'var(--accent-dim)',
  Critical: 'var(--red-dim)',
};

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isOverdue(iso?: string, status?: TaskStatus) {
  if (!iso || status === 'Done') return false;
  return new Date(iso) < new Date();
}

interface FlatTask extends Task {
  accountId: string;
  accountName: string;
  opportunityName?: string;
}

export function TaskKanban() {
  const { state, dispatch } = useCrm();

  const [fAccount,  setFAccount]  = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fAssignee, setFAssignee] = useState('');

  // Flatten all tasks across accounts
  const allTasks = useMemo<FlatTask[]>(() => {
    return state.accounts.flatMap(acc =>
      acc.tasks.map(t => ({
        ...t,
        accountId: acc.id,
        accountName: acc.name,
        opportunityName: t.opportunityId
          ? acc.opportunities.find(o => o.id === t.opportunityId)?.name
          : undefined,
      }))
    );
  }, [state.accounts]);

  const assignees = useMemo(() =>
    [...new Set(allTasks.map(t => t.assignee).filter(Boolean) as string[])].sort(),
    [allTasks]
  );

  const filtered = useMemo(() =>
    allTasks.filter(t =>
      (!fAccount  || t.accountId === fAccount) &&
      (!fPriority || t.priority === fPriority) &&
      (!fAssignee || t.assignee === fAssignee)
    ),
    [allTasks, fAccount, fPriority, fAssignee]
  );

  const hasFilters = !!(fAccount || fPriority || fAssignee);

  function cycleStatus(task: FlatTask) {
    const order: TaskStatus[] = ['To do', 'In progress', 'Blocked', 'Done'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, status: next } });
  }

  const selectStyle = {
    padding: '6px 10px', fontSize: 12, fontWeight: 500,
    background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text2)', cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filter bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
      }}>
        <select style={selectStyle} value={fAccount} onChange={e => setFAccount(e.target.value)}>
          <option value="">All accounts</option>
          {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select style={selectStyle} value={fPriority} onChange={e => setFPriority(e.target.value)}>
          <option value="">All priorities</option>
          {(['Critical', 'High', 'Medium', 'Low'] as TaskPriority[]).map(p =>
            <option key={p} value={p}>{p}</option>
          )}
        </select>

        <select style={selectStyle} value={fAssignee} onChange={e => setFAssignee(e.target.value)}>
          <option value="">All assignees</option>
          {assignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setFAccount(''); setFPriority(''); setFAssignee(''); }}
            style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px' }}
          >
            Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Kanban columns */}
      <div style={{
        flex: 1, overflowX: 'auto', overflowY: 'hidden',
        display: 'flex', gap: 0, padding: '20px 24px',
        background: 'var(--bg)',
      }}>
        {COLUMNS.map(col => {
          const cards = filtered.filter(t => t.status === col.status)
            .sort((a, b) => {
              const pri: Record<TaskPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
              return pri[a.priority] - pri[b.priority];
            });

          return (
            <div
              key={col.status}
              style={{
                flex: '1 1 0', minWidth: 240, maxWidth: 360,
                display: 'flex', flexDirection: 'column',
                marginRight: 12,
              }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12, padding: '0 2px',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {col.label}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: cards.length > 0 ? col.color : 'var(--text3)',
                  background: cards.length > 0 ? col.color + '18' : 'transparent',
                  borderRadius: 99, padding: '0 6px', marginLeft: 2,
                }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cards.map(task => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const date = fmtDate(task.dueDate);

                  return (
                    <div
                      key={task.id}
                      style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r)',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'border-color 0.12s, box-shadow 0.12s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                      }}
                    >
                      {/* Priority + account */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 6 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px',
                          borderRadius: 99, flexShrink: 0,
                          color: PRIORITY_COLOR[task.priority],
                          background: PRIORITY_BG[task.priority],
                          border: `1px solid ${PRIORITY_COLOR[task.priority]}33`,
                        }}>
                          {task.priority}
                        </span>
                        <span style={{
                          fontSize: 10, color: 'var(--text3)', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {task.accountName}
                        </span>
                      </div>

                      {/* Title */}
                      <div style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--text)',
                        lineHeight: 1.4, marginBottom: 8,
                        textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                        opacity: task.status === 'Done' ? 0.5 : 1,
                      }}>
                        {task.title}
                      </div>

                      {/* Opportunity tag */}
                      {task.opportunityName && (
                        <div style={{
                          fontSize: 10, color: 'var(--accent)', fontWeight: 600,
                          marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ opacity: 0.6 }}>●</span> {task.opportunityName}
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        {task.assignee ? (
                          <span style={{
                            fontSize: 10, color: 'var(--text3)', fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            → {task.assignee}
                          </span>
                        ) : <span />}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {date && (
                            <span style={{ fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400 }}>
                              {overdue ? '⚠ ' : ''}{date}
                            </span>
                          )}
                          {/* Advance status button */}
                          <button
                            onClick={() => cycleStatus(task)}
                            title="Advance status"
                            style={{
                              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                              background: task.status === 'Done' ? 'var(--green)' : 'transparent',
                              border: `2px solid ${col.color}`,
                              cursor: 'pointer', padding: 0,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {cards.length === 0 && (
                  <div style={{
                    border: '1.5px dashed var(--border2)',
                    borderRadius: 'var(--r)', padding: '20px 0',
                    textAlign: 'center', color: 'var(--text3)', fontSize: 12,
                  }}>
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
