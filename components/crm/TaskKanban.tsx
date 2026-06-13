'use client';
import { useState, useMemo, useEffect } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Task, TaskStatus, TaskPriority } from '@/lib/crmTypes';

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'To do',       label: 'To do',       color: 'var(--text3)' },
  { status: 'In progress', label: 'In progress',  color: 'var(--blue)'  },
  { status: 'Done',        label: 'Done',         color: 'var(--green)' },
  { status: 'Blocked',     label: 'Blocked',      color: 'var(--red)'   },
];

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  Low: 'var(--text3)', Medium: 'var(--amber)', High: 'var(--accent)', Critical: 'var(--red)',
};
const PRIORITY_BG: Record<TaskPriority, string> = {
  Low: 'transparent', Medium: 'var(--amber-dim)', High: 'var(--accent-dim)', Critical: 'var(--red-dim)',
};

function fmtDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
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

interface DropTarget {
  colStatus: TaskStatus;
  insertBeforeId: string | null; // null = end of column
}

import { DrawerTask } from './TaskDetailDrawer';
interface KanbanProps { fAccount: string; fPriority: string; fAssignee: string; onTaskClick?: (t: DrawerTask) => void; }

export function TaskKanban({ fAccount, fPriority, fAssignee, onTaskClick }: KanbanProps) {
  const { state, dispatch } = useCrm();

  // Flat list of all tasks across all accounts
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
    ), [state.accounts]);

  // Presentation order — initialised by priority, then maintained manually by drag
  const [manualOrder, setManualOrder] = useState<string[]>([]);

  useEffect(() => {
    const byPri: Record<TaskPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const sorted = [...allTasks].sort((a, b) => byPri[a.priority] - byPri[b.priority]).map(t => t.id);
    setManualOrder(prev => {
      const existing = new Set(prev);
      const newIds   = sorted.filter(id => !existing.has(id));
      return [...prev.filter(id => allTasks.some(t => t.id === id)), ...newIds];
    });
  }, [allTasks]);

  const filtered = useMemo(() =>
    allTasks.filter(t =>
      (!fAccount  || t.accountId === fAccount) &&
      (!fPriority || t.priority  === fPriority) &&
      (!fAssignee || t.assignee  === fAssignee)
    ), [allTasks, fAccount, fPriority, fAssignee]);

  function colCards(status: TaskStatus): FlatTask[] {
    return manualOrder
      .map(id => filtered.find(t => t.id === id))
      .filter((t): t is FlatTask => !!t && t.status === status);
  }

  // ── Drag state ──────────────────────────────────────────────────
  const [dragId,     setDragId]     = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const dragTask = dragId ? allTasks.find(t => t.id === dragId) : null;

  function onDragStart(e: React.DragEvent, taskId: string) {
    setDragId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image so the ghost doesn't flicker weirdly
    const ghost = document.createElement('div');
    ghost.style.position = 'fixed';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function onDragOverCard(e: React.DragEvent, cardId: string, colStatus: TaskStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isTop = e.clientY < rect.top + rect.height / 2;
    setDropTarget({ colStatus, insertBeforeId: isTop ? cardId : getCardAfter(cardId, colStatus) });
  }

  function getCardAfter(cardId: string, status: TaskStatus): string | null {
    const cards = colCards(status);
    const idx = cards.findIndex(t => t.id === cardId);
    return idx < cards.length - 1 ? cards[idx + 1].id : null;
  }

  function onDragOverColumn(e: React.DragEvent, colStatus: TaskStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Only fire if not already handled by a card
    if (!(e.target as HTMLElement).closest('[data-card]')) {
      setDropTarget({ colStatus, insertBeforeId: null });
    }
  }

  function onDrop(colStatus: TaskStatus) {
    if (!dragId || !dragTask) return;

    // 1. Update status if moved to a different column
    if (dragTask.status !== colStatus) {
      dispatch({
        type: 'UPDATE_TASK',
        accountId: dragTask.accountId,
        task: { ...dragTask, status: colStatus },
      });
    }

    // 2. Reorder manualOrder
    const insertBefore = dropTarget?.insertBeforeId ?? null;
    setManualOrder(prev => {
      const without = prev.filter(id => id !== dragId);
      if (insertBefore === null) {
        return [...without, dragId];
      }
      const idx = without.indexOf(insertBefore);
      if (idx === -1) return [...without, dragId];
      return [...without.slice(0, idx), dragId, ...without.slice(idx)];
    });

    setDragId(null);
    setDropTarget(null);
  }

  function onDragEnd() {
    setDragId(null);
    setDropTarget(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Columns */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: 0, padding: '20px 24px', background: 'var(--bg)' }}>
        {COLUMNS.map(col => {
          const cards     = colCards(col.status);
          const isColOver = dropTarget?.colStatus === col.status;

          return (
            <div
              key={col.status}
              onDragOver={e => onDragOverColumn(e, col.status)}
              onDrop={() => onDrop(col.status)}
              style={{
                flex: '1 1 0', minWidth: 240, maxWidth: 360,
                display: 'flex', flexDirection: 'column', marginRight: 12,
                borderRadius: 'var(--r)',
                background: isColOver && cards.length === 0 ? 'var(--bg3)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 2px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {col.label}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '0 6px', marginLeft: 2,
                  color: cards.length > 0 ? col.color : 'var(--text3)',
                  background: cards.length > 0 ? col.color + '18' : 'transparent',
                }}>
                  {cards.length}
                </span>
              </div>

              {/* Card list */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {cards.map(task => {
                  const isDragging = task.id === dragId;
                  const showLineBefore = dropTarget?.colStatus === col.status && dropTarget.insertBeforeId === task.id;
                  const overdue = isOverdue(task.dueDate, task.status);
                  const date    = fmtDate(task.dueDate);

                  return (
                    <div key={task.id}>
                      {/* Drop indicator line — above this card */}
                      {showLineBefore && (
                        <div style={{ height: 2, background: 'var(--blue)', borderRadius: 99, margin: '2px 0', opacity: 0.8 }} />
                      )}

                      <div
                        data-card
                        draggable
                        onClick={() => {
                          if (onTaskClick) {
                            const acc = allTasks.find(t => t.id === task.id);
                            if (acc) onTaskClick(acc as DrawerTask);
                          }
                        }}
                        onDragStart={e => onDragStart(e, task.id)}
                        onDragOver={e => { e.stopPropagation(); onDragOverCard(e, task.id, col.status); }}
                        onDragEnd={onDragEnd}
                        style={{
                          background: 'var(--bg2)',
                          border: `1px solid ${isDragging ? 'var(--blue)' : 'var(--border)'}`,
                          borderRadius: 'var(--r)',
                          padding: '12px 14px',
                          marginBottom: 8,
                          cursor: 'grab',
                          opacity: isDragging ? 0.4 : 1,
                          transition: 'opacity 0.15s, border-color 0.12s, box-shadow 0.12s',
                          userSelect: 'none',
                        }}
                        onMouseEnter={e => {
                          if (isDragging) return;
                          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border2)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = isDragging ? 'var(--blue)' : 'var(--border)';
                          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        }}
                      >
                        {/* Priority + account */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, flexShrink: 0,
                            color: PRIORITY_COLOR[task.priority], background: PRIORITY_BG[task.priority],
                            border: `1px solid ${PRIORITY_COLOR[task.priority]}33`,
                          }}>
                            {task.priority}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.accountName}
                          </span>
                        </div>

                        {/* Title */}
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 8,
                          textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                          opacity: task.status === 'Done' ? 0.5 : 1,
                        }}>
                          {task.title}
                        </div>

                        {/* Opportunity */}
                        {task.opportunityName && (
                          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ opacity: 0.6 }}>●</span> {task.opportunityName}
                          </div>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          {task.assignee
                            ? <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>→ {task.assignee}</span>
                            : <span />}
                          {date && (
                            <span style={{ fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400, flexShrink: 0 }}>
                              {overdue ? '⚠ ' : ''}{date}
                            </span>
                          )}
                        </div>

                        {/* Trailing comments preview */}
                        {task.comments && task.comments.length > 0 && (() => {
                          const last = task.comments[task.comments.length - 1];
                          return (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <div style={{
                                width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                                background: `hsl(${last.author.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360},50%,48%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 7, fontWeight: 700, color: '#fff',
                              }}>
                                {last.author.slice(0, 2).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 10, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {last.text}
                                </div>
                                {task.comments.length > 1 && (
                                  <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>+{task.comments.length - 1} more</div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}

                {/* Drop indicator at end of column */}
                {dropTarget?.colStatus === col.status && dropTarget.insertBeforeId === null && cards.length > 0 && (
                  <div style={{ height: 2, background: 'var(--blue)', borderRadius: 99, margin: '0 0 8px', opacity: 0.8 }} />
                )}

                {/* Empty column drop zone */}
                {cards.length === 0 && (
                  <div style={{
                    border: `1.5px dashed ${isColOver ? 'var(--blue)' : 'var(--border2)'}`,
                    borderRadius: 'var(--r)', padding: '24px 0',
                    textAlign: 'center', color: isColOver ? 'var(--blue)' : 'var(--text3)', fontSize: 12,
                    transition: 'border-color 0.12s, color 0.12s',
                  }}>
                    {isColOver ? 'Drop here' : 'Empty'}
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
