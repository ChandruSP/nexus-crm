'use client';
import { useState, useEffect, useRef } from 'react';
import { useCrm } from '@/context/CrmContext';
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

const AUTHOR_KEY = 'pulse-comment-author';

export function TaskDetailDrawer({ task, onClose }: Props) {
  const { dispatch } = useCrm();
  const { toast }    = useToast();
  const [author,      setAuthor]      = useState(() => localStorage.getItem(AUTHOR_KEY) ?? '');
  const [editingName, setEditingName] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editing,     setEditing]     = useState(false);
  const [delConfirm,  setDelConfirm]  = useState(false);
  const [editForm,    setEditForm]    = useState({ title: task.title, description: task.description ?? '', priority: task.priority, dueDate: task.dueDate ?? '', assignee: task.assignee ?? '' });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (author) localStorage.setItem(AUTHOR_KEY, author); }, [author]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [task.comments?.length]);
  // Sync editForm when task changes externally
  useEffect(() => { setEditForm({ title: task.title, description: task.description ?? '', priority: task.priority, dueDate: task.dueDate ?? '', assignee: task.assignee ?? '' }); }, [task.id]);

  function cycleStatus() {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, status: next } });
    toast(`Moved to ${next}`, 'info');
  }

  function saveEdit() {
    if (!editForm.title.trim()) return;
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, title: editForm.title.trim(), description: editForm.description.trim() || undefined, priority: editForm.priority, dueDate: editForm.dueDate || undefined, assignee: editForm.assignee.trim() || undefined } });
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

  const comments = task.comments ?? [];

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
              {editing ? (
                <input style={{ ...inp, fontSize: 14, fontWeight: 700, background: 'var(--bg3)' }} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} autoFocus />
              ) : (
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{task.title}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => setEditing(e => !e)} title={editing ? 'Cancel edit' : 'Edit task'}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: editing ? 'var(--accent-dim)' : 'transparent', border: `1px solid ${editing ? 'var(--accent-border)' : 'var(--border2)'}`, borderRadius: 'var(--r-xs)', cursor: 'pointer', color: editing ? 'var(--accent)' : 'var(--text3)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => setDelConfirm(true)} title="Delete task"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--red)' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M4 3v7h4V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18 }}>×</button>
            </div>
          </div>

          {editing ? (
            /* Edit fields */
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                <input style={inp} value={editForm.assignee} onChange={e => setEditForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Name" />
              </div>
              <div>
                <span style={lbl}>Description</span>
                <textarea style={{ ...inp, resize: 'none', minHeight: 56, lineHeight: 1.55 }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveEdit} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Save</button>
                <button onClick={() => setEditing(false)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
              </div>
            </div>
          ) : (
            /* View mode chips */
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <button onClick={cycleStatus} title="Click to advance status"
                  style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, cursor: 'pointer', color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '18', border: `1px solid ${STATUS_COLOR[task.status]}40` }}>
                  {task.status}
                </button>
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
          )}
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
          {author && !editingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: `hsl(${author.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360},50%,48%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                {author.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{author}</span>
              <button type="button" onClick={() => setEditingName(true)} style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}>change</button>
            </div>
          ) : (
            <input style={inp} value={author} autoFocus={editingName}
              onChange={e => setAuthor(e.target.value)}
              onBlur={() => { if (author.trim()) setEditingName(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (author.trim()) setEditingName(false); } }}
              placeholder="Your name" />
          )}
          <textarea style={{ ...inp, resize: 'none', minHeight: 72, lineHeight: 1.55 }}
            value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(e as any); }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>⌘↵ to submit</span>
            <button type="submit" style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Comment</button>
          </div>
        </form>

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
