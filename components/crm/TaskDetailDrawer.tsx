'use client';
import { useState, useEffect, useRef } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Task, TaskStatus, Comment } from '@/lib/crmTypes';

const STATUS_COLOR: Record<TaskStatus, string> = {
  'To do': 'var(--text3)', 'In progress': 'var(--blue)', 'Done': 'var(--green)', 'Blocked': 'var(--red)',
};
const STATUS_ORDER: TaskStatus[] = ['To do', 'In progress', 'Done', 'Blocked'];

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

interface Props {
  task: DrawerTask;
  onClose: () => void;
}

const AUTHOR_KEY = 'pulse-comment-author';

export function TaskDetailDrawer({ task, onClose }: Props) {
  const { dispatch } = useCrm();
  const [author,      setAuthor]      = useState(() => localStorage.getItem(AUTHOR_KEY) ?? '');
  const [commentText, setCommentText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (author) localStorage.setItem(AUTHOR_KEY, author);
  }, [author]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task.comments?.length]);

  function cycleStatus() {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
    dispatch({ type: 'UPDATE_TASK', accountId: task.accountId, task: { ...task, status: next } });
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      text: commentText.trim(),
      author: author.trim() || 'You',
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_COMMENT', accountId: task.accountId, taskId: task.id, comment });
    setCommentText('');
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 'var(--r-sm)',
    background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const comments = task.comments ?? [];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.25)' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
        zIndex: 201, background: 'var(--bg2)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                {task.accountName}{task.opportunityName ? ` · ${task.opportunityName}` : ''}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{task.title}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 20, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
          </div>

          {/* Status + meta chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <button onClick={cycleStatus} title="Click to advance status"
              style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, cursor: 'pointer',
                color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '18',
                border: `1px solid ${STATUS_COLOR[task.status]}40` }}>
              {task.status}
            </button>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>
                Due {fmtDate(task.dueDate)}
              </span>
            )}
            {task.assignee && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>
                → {task.assignee}
              </span>
            )}
          </div>

          {task.description && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)' }}>
              {task.description}
            </div>
          )}
        </div>

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            Comments ({comments.length})
          </div>

          {comments.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '24px 0' }}>
              No comments yet. Be the first to add one.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: `hsl(${c.author.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360},50%,48%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                }}>
                  {c.author.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.author}</span>
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtTime(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Add comment */}
        <form onSubmit={submitComment} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input style={inp} value={author} onChange={e => setAuthor(e.target.value)} placeholder="Your name" />
          <textarea style={{ ...inp, resize: 'none', minHeight: 72, lineHeight: 1.55 }}
            value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(e as any); }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>⌘↵ to submit</span>
            <button type="submit" style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>
              Comment
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
