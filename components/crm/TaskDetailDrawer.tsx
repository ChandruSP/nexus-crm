'use client';
import { useState, useEffect, useRef } from 'react';
import { useCrm } from '@/context/CrmContext';
import { useConfig } from '@/context/ConfigContext';
import { useToast } from '@/context/ToastContext';
import { Task, TaskStatus, TaskPriority, Comment } from '@/lib/crmTypes';

const STATUS_COLOR: Record<TaskStatus, string> = {
  'To do': 'var(--text3)', 'In progress': 'var(--blue)', 'Done': 'var(--green)', 'Blocked': 'var(--red)',
};
const STATUS_ORDER: TaskStatus[] = ['To do', 'In progress', 'Done', 'Blocked'];
const PRIORITY_ORDER: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_COLOR: Record<TaskPriority, string> = { Low: 'var(--text3)', Medium: 'var(--amber)', High: 'var(--accent)', Critical: 'var(--red)' };

function fmtDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export interface DrawerTask extends Task {
  accountId: string;
  accountName: string;
  opportunityName?: string;
}

interface Props { task: DrawerTask; onClose: () => void; }

const AUTHOR_KEY = 'nexus-comment-author';

function detectAuthor(): string {
  const stored = localStorage.getItem(AUTHOR_KEY);
  if (stored) return stored;
  return 'You';
}

export function TaskDetailDrawer({ task, onClose }: Props) {
  const { state, dispatch } = useCrm();
  const { config } = useConfig();
  const { toast }    = useToast();
  const liveTask = state.accounts.find(a => a.id === task.accountId)?.tasks.find(t => t.id === task.id);
  const comments = (liveTask ?? task).comments ?? [];
  const author = detectAuthor();
  const [commentText, setCommentText] = useState('');
  const [editing,     setEditing]     = useState(false);
  const [delConfirm,  setDelConfirm]  = useState(false);
  const [editForm,    setEditForm]    = useState({ title: task.title, description: task.description ?? '', status: task.status, priority: task.priority, dueDate: task.dueDate ?? '', assignee: task.assignee ?? '' });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments.length]);
  // Sync editForm when task changes externally
  useEffect(() => { setEditForm({ title: task.title, description: task.description ?? '', status: task.status, priority: task.priority, dueDate: task.dueDate ?? '', assignee: task.assignee ?? '' }); }, [task.id]);

  function cycleStatus() {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, status: next } });
    toast(`Moved to ${next}`, 'info');
  }

  function saveEdit() {
    if (!editForm.title.trim()) return;
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, title: editForm.title.trim(), description: editForm.description.trim() || undefined, status: editForm.status, priority: editForm.priority, dueDate: editForm.dueDate || undefined, assignee: editForm.assignee.trim() || undefined } });
    toast('Task updated');
    setEditing(false);
  }

  function handleDelete() {
    dispatch({ type: 'DELETE_TASK', accountId: task.accountId, taskId: task.id });
    toast(`"${task.title}" deleted`, 'info');
    setDelConfirm(false);
    onClose();
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const comment: Comment = { id: `c-${Date.now()}`, text: commentText.trim(), author: author.trim() || 'You', createdAt: Date.now() };
    dispatch({ type: 'ADD_COMMENT', accountId: task.accountId, taskId: task.id, comment });
    toast('Comment added');
    setCommentText('');
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--r-sm)',
    background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, display: 'block' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.25)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 201, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                {task.accountName}{task.opportunityName ? ` · ${task.opportunityName}` : ''}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{(liveTask ?? task).title}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => setEditing(true)} title="Edit task"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text2)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--accent)'; b.style.borderColor = 'var(--accent)'; b.style.background = 'var(--accent-dim)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text2)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => setDelConfirm(true)} title="Delete task"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--red)', transition: 'border-color 0.12s, background 0.12s' }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={onClose} title="Close"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid transparent', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, transition: 'color 0.12s, border-color 0.12s' }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--text)'; b.style.borderColor = 'var(--border2)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'transparent'; }}>×</button>
            </div>
          </div>

          {/* View mode chips always visible; edit modal overlays everything */}
          <div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '18', border: `1px solid ${STATUS_COLOR[task.status]}40` }}>
                {task.status}
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
              {task.dueDate && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>Due {fmtDate(task.dueDate)}</span>}
              {task.assignee && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>→ {task.assignee}</span>}
            </div>
            {task.description && (
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)' }}>
                {task.description}
              </div>
            )}
          </div>
        </div>

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            Comments ({comments.length})
          </div>
          {comments.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '24px 0' }}>No comments yet. Be the first to add one.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `hsl(${c.author.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360},50%,48%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                  {c.author.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.author}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtTime(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{c.text}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Add comment */}
        <form onSubmit={submitComment} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: `hsl(${author.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360},50%,48%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
              {author.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{author}</span>
          </div>
          <textarea style={{ ...inp, resize: 'none', minHeight: 72, lineHeight: 1.55 }}
            value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(e as any); }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>⌘↵ to submit</span>
            <button type="submit" style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Comment</button>
          </div>
        </form>

        {/* Edit task modal */}
        {editing && (
          <>
            <div onClick={() => setEditing(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300 }} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 301, background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 460, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.22)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Edit Task</div>
                <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text3)', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <span style={lbl}>Title</span>
                  <input style={{ ...inp, fontSize: 14, fontWeight: 600 }} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={lbl}>Status</span>
                    <select style={{ ...inp, cursor: 'pointer' }} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as TaskStatus }))}>
                      {STATUS_ORDER.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={lbl}>Priority</span>
                    <select style={{ ...inp, cursor: 'pointer' }} value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
                      {PRIORITY_ORDER.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <span style={lbl}>Due Date</span>
                    <input type="date" style={inp} value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <span style={lbl}>Assignee</span>
                  <select style={{ ...inp, cursor: 'pointer' }} value={editForm.assignee} onChange={e => setEditForm(f => ({ ...f, assignee: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {config.teamMembers.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <span style={lbl}>Description</span>
                  <textarea style={{ ...inp, resize: 'none', minHeight: 80, lineHeight: 1.55 }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={saveEdit} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Save</button>
                  <button onClick={() => setEditing(false)} style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete task modal */}
        {delConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDelConfirm(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete task?</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>"{task.title}"</strong> will be permanently deleted.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setDelConfirm(false)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
                <button onClick={handleDelete} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Delete Task</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
