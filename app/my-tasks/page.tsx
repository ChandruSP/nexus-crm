'use client';
import { useEffect, useState, useMemo, Fragment, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AssigneeAutocomplete } from '@/components/crm/AssigneeAutocomplete';

// ── Types ────────────────────────────────────────────────────────────────────

type TaskStatus   = 'To do' | 'In progress' | 'Done' | 'Blocked';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

interface MyTask {
  id: string; title: string; status: TaskStatus; priority: TaskPriority;
  dueDate: string | null; description: string; assignee: string;
  comments: string[]; createdAt: number;
  accountId: string; accountName: string;
  departmentId: string; departmentName: string;
  departmentIcon: string; departmentColor: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES: TaskStatus[]     = ['To do', 'In progress', 'Done', 'Blocked'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_RANK: Record<TaskPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const STATUS_COLOR: Record<TaskStatus, string> = {
  'To do': 'var(--text3)', 'In progress': 'var(--blue)', 'Done': 'var(--green)', 'Blocked': 'var(--red)',
};
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  Low: 'var(--text3)', Medium: 'var(--amber)', High: 'var(--accent)', Critical: 'var(--red)',
};
const PRIORITY_BG: Record<TaskPriority, string> = {
  Low: 'transparent', Medium: 'var(--amber-dim)', High: 'var(--accent-dim)', Critical: 'var(--red-dim)',
};

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}
function fmtDateShort(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function isOverdue(iso?: string | null, status?: TaskStatus) {
  if (!iso || status === 'Done') return false;
  return new Date(iso) < new Date();
}

async function patchTask(t: MyTask, patch: Partial<MyTask>) {
  const url = t.accountId
    ? `/api/accounts/${t.accountId}/tasks/${t.id}`
    : `/api/departments/${t.departmentId}/tasks/${t.id}`;
  const body = { title: t.title, description: t.description, status: t.status, priority: t.priority,
    dueDate: t.dueDate, assignee: t.assignee, ...patch };
  await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

async function deleteTask(t: MyTask) {
  const url = t.accountId
    ? `/api/accounts/${t.accountId}/tasks/${t.id}`
    : `/api/departments/${t.departmentId}/tasks/${t.id}`;
  await fetch(url, { method: 'DELETE' });
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditTaskModal({ task, onSave, onClose }: { task: MyTask; onSave: (t: MyTask) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: task.title, description: task.description, status: task.status,
    priority: task.priority, dueDate: task.dueDate?.slice(0, 10) ?? '', assignee: task.assignee,
  });
  const [saving, setSaving] = useState(false);
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 'var(--r-sm)', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const updated: MyTask = { ...task, ...form, title: form.title.trim(), description: form.description.trim(), dueDate: form.dueDate || null };
    await patchTask(task, { title: updated.title, description: updated.description, status: updated.status, priority: updated.priority, dueDate: updated.dueDate, assignee: updated.assignee });
    onSave(updated);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 800 }} />
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
              <AssigneeAutocomplete value={form.assignee} onChange={v => setForm(f => ({ ...f, assignee: v }))} />
            </div>
          </div>
          <div><label style={lbl}>Description</label><textarea style={{ ...inp, resize: 'vertical', minHeight: 72, lineHeight: 1.55 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ task, onDelete, onClose }: { task: MyTask; onDelete: () => void; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete task?</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>"{task.title}"</strong> will be permanently deleted.</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
          <button disabled={busy} onClick={async () => { setBusy(true); await deleteTask(task); onDelete(); }} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', opacity: busy ? 0.7 : 1 }}>Delete Task</button>
        </div>
      </div>
    </div>
  );
}

// ── Comment helpers ───────────────────────────────────────────────────────────

interface ParsedComment { id: string; text: string; author: string; createdAt: number; }

function parseComment(raw: string): ParsedComment {
  try { return JSON.parse(raw); } catch { return { id: raw, text: raw, author: '', createdAt: 0 }; }
}

function fmtCommentTime(ts: number) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

// ── Task Detail Drawer ────────────────────────────────────────────────────────

function TaskDrawer({ task, onClose, onUpdate, onDelete }: { task: MyTask; onClose: () => void; onUpdate: (t: MyTask) => void; onDelete: () => void }) {
  const [editing,     setEditing]     = useState(false);
  const [delConfirm,  setDelConfirm]  = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [author,      setAuthor]      = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const overdue = isOverdue(task.dueDate, task.status);

  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(d => { if (d.user?.name) setAuthor(d.user.name); }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [task.comments.length]);

  const comments = task.comments.map(parseComment);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const newComment: ParsedComment = { id: `c-${Date.now()}`, text: commentText.trim(), author, createdAt: Date.now() };
    const commentUrl = task.accountId
      ? `/api/accounts/${task.accountId}/tasks/${task.id}/comments`
      : `/api/departments/${task.departmentId}/tasks/${task.id}/comments`;
    try {
      const res = await fetch(commentUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newComment) });
      if (!res.ok) throw new Error(`${res.status}`);
      const savedTask = await res.json();
      // Use authoritative DB state so comments are always accurate
      const fresh: MyTask = { ...task, comments: savedTask.comments ?? [] };
      onUpdate(fresh);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert('Failed to save comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const btnStyle: React.CSSProperties = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text2)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.25)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 201, background: 'var(--bg2)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', fontFamily: 'Instrument Sans, sans-serif' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                {task.departmentIcon} {task.departmentName}{task.accountName ? ` · ${task.accountName}` : ''}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>{task.title}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => setEditing(true)} title="Edit task" style={btnStyle}
                onMouseEnter={e => { const b = e.currentTarget; b.style.color='var(--accent)'; b.style.borderColor='var(--accent)'; b.style.background='var(--accent-dim)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.color='var(--text2)'; b.style.borderColor='var(--border2)'; b.style.background='transparent'; }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => setDelConfirm(true)} title="Delete task" style={{ ...btnStyle, color: 'var(--red)' }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor='var(--red)'; b.style.background='var(--red-dim)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor='var(--border2)'; b.style.background='transparent'; }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={onClose} title="Close" style={{ ...btnStyle, color: 'var(--text3)', fontSize: 18 }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.color='var(--text)'; b.style.borderColor='var(--border2)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.color='var(--text3)'; b.style.borderColor='transparent'; }}>×</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: task.description ? 8 : 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99, color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status]+'18', border: `1px solid ${STATUS_COLOR[task.status]}40` }}>{task.status}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
            {task.dueDate && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: overdue ? 'var(--red)' : 'var(--text3)' }}>{overdue ? '⚠ ' : ''}Due {fmtDate(task.dueDate)}</span>}
            {task.assignee && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'var(--bg4)', color: 'var(--text3)' }}>→ {task.assignee}</span>}
          </div>
          {task.description && (
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)' }}>{task.description}</div>
          )}
        </div>

        {/* Comments list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            Comments ({comments.length})
          </div>
          {comments.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '24px 0' }}>No comments yet.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `hsl(${c.author.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360},50%,48%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                  {initials(c.author)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.author || 'Unknown'}</span>
                    {c.createdAt > 0 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{fmtCommentTime(c.createdAt)}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{c.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div ref={bottomRef} />
        </div>

        {/* Comment input */}
        <form onSubmit={submitComment} style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Add a comment…"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            style={{ flex: 1, padding: '8px 10px', fontSize: 12, borderRadius: 'var(--r-sm)', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
          />
          <button type="submit" disabled={!commentText.trim() || submitting}
            style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', opacity: (!commentText.trim() || submitting) ? 0.5 : 1, flexShrink: 0 }}>
            {submitting ? '…' : 'Post'}
          </button>
        </form>
      </div>

      {editing && <EditTaskModal task={task} onClose={() => setEditing(false)} onSave={t => { onUpdate(t); setEditing(false); }} />}
      {delConfirm && <DeleteConfirm task={task} onClose={() => setDelConfirm(false)} onDelete={() => { onDelete(); setDelConfirm(false); onClose(); }} />}
    </>
  );
}

// ── Kanban ────────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { status: 'To do'       as TaskStatus, color: 'var(--text3)' },
  { status: 'In progress' as TaskStatus, color: 'var(--blue)'  },
  { status: 'Done'        as TaskStatus, color: 'var(--green)' },
  { status: 'Blocked'     as TaskStatus, color: 'var(--red)'   },
];

interface KanbanDropTarget { colStatus: TaskStatus; insertBeforeId: string | null; }

function KanbanView({ tasks, onEdit, onDelete, onTaskClick, onStatusChange }: {
  tasks: MyTask[];
  onEdit: (t: MyTask) => void;
  onDelete: (t: MyTask) => void;
  onTaskClick: (t: MyTask) => void;
  onStatusChange: (t: MyTask, s: TaskStatus) => void;
}) {
  const [dragId,     setDragId]     = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<KanbanDropTarget | null>(null);
  const [order,      setOrder]      = useState<string[]>(() => tasks.map(t => t.id));

  // Keep order in sync when tasks list changes (filter/search)
  useMemo(() => {
    setOrder(prev => {
      const ids = new Set(tasks.map(t => t.id));
      const kept = prev.filter(id => ids.has(id));
      const added = tasks.filter(t => !prev.includes(t.id)).map(t => t.id);
      return [...kept, ...added];
    });
  }, [tasks]);

  function colCards(status: TaskStatus) {
    return order.map(id => tasks.find(t => t.id === id)).filter((t): t is MyTask => !!t && t.status === status);
  }
  function cardAfter(cardId: string, status: TaskStatus) {
    const cards = colCards(status);
    const idx = cards.findIndex(t => t.id === cardId);
    return idx < cards.length - 1 ? cards[idx + 1].id : null;
  }

  function onDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.position = 'fixed'; ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }
  function onDragOverCard(e: React.DragEvent, cardId: string, colStatus: TaskStatus) {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isTop = e.clientY < rect.top + rect.height / 2;
    setDropTarget({ colStatus, insertBeforeId: isTop ? cardId : cardAfter(cardId, colStatus) });
  }
  function onDragOverCol(e: React.DragEvent, colStatus: TaskStatus) {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (!(e.target as HTMLElement).closest('[data-card]'))
      setDropTarget({ colStatus, insertBeforeId: null });
  }
  function onDrop(colStatus: TaskStatus) {
    if (!dragId) return;
    const dragTask = tasks.find(t => t.id === dragId);
    if (dragTask && dragTask.status !== colStatus) onStatusChange(dragTask, colStatus);
    const insertBefore = dropTarget?.insertBeforeId ?? null;
    setOrder(prev => {
      const without = prev.filter(id => id !== dragId);
      if (insertBefore === null) return [...without, dragId];
      const idx = without.indexOf(insertBefore);
      return idx === -1 ? [...without, dragId] : [...without.slice(0, idx), dragId, ...without.slice(idx)];
    });
    setDragId(null); setDropTarget(null);
  }
  function onDragEnd() { setDragId(null); setDropTarget(null); }

  return (
    <div style={{ flex: 1, display: 'flex', gap: 12, padding: '16px 20px', overflowX: 'auto', overflowY: 'hidden', alignItems: 'flex-start' }}>
      {KANBAN_COLUMNS.map(col => {
        const colTasks = colCards(col.status);
        const isColOver = dropTarget?.colStatus === col.status;
        return (
          <div key={col.status}
            onDragOver={e => onDragOverCol(e, col.status)}
            onDrop={() => onDrop(col.status)}
            style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '100%', borderRadius: 'var(--r)', background: isColOver && colTasks.length === 0 ? 'var(--bg3)' : 'transparent', transition: 'background 0.1s' }}>
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 2px', flexShrink: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col.status}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>{colTasks.length}</span>
            </div>
            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', paddingBottom: 8 }}>
              {colTasks.map(t => {
                const overdue = isOverdue(t.dueDate, t.status);
                const isDragging = dragId === t.id;
                const isDropBefore = dropTarget?.colStatus === col.status && dropTarget?.insertBeforeId === t.id;
                return (
                  <Fragment key={t.id}>
                    {isDropBefore && <div style={{ height: 3, borderRadius: 2, background: 'var(--accent)', margin: '0 2px', flexShrink: 0 }} />}
                    <div
                      data-card
                      draggable
                      onDragStart={e => onDragStart(e, t.id)}
                      onDragOver={e => onDragOverCard(e, t.id, col.status)}
                      onDragEnd={onDragEnd}
                      onClick={() => onTaskClick(t)}
                      style={{ background: 'var(--bg2)', border: `1px solid ${isDragging ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r)', padding: '12px 14px', cursor: 'grab', opacity: isDragging ? 0.4 : 1, transition: 'border-color 0.12s, box-shadow 0.12s, opacity 0.12s' }}
                      onMouseEnter={e => { if (!isDragging) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; } }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isDragging ? 'var(--accent)' : 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, color: PRIORITY_COLOR[t.priority], background: PRIORITY_BG[t.priority], border: `1px solid ${PRIORITY_COLOR[t.priority]}33` }}>{t.priority}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 10 }}>{t.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {t.accountName && <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 99 }}>{t.accountName}</span>}
                        <span style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg3)', padding: '1px 6px', borderRadius: 99 }}>{t.departmentIcon} {t.departmentName}</span>
                        {t.dueDate && (
                          <span style={{ fontSize: 10, color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400, marginLeft: 'auto' }}>
                            {overdue ? '⚠ ' : ''}{fmtDateShort(t.dueDate)}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                        <select value={t.status} onChange={e => onStatusChange(t, e.target.value as TaskStatus)}
                          style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99, border: `1px solid ${STATUS_COLOR[t.status]}40`, background: STATUS_COLOR[t.status]+'18', color: STATUS_COLOR[t.status], cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'inherit', width: '100%' }}>
                          {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--bg2)', color: 'var(--text)' }}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              {dropTarget?.colStatus === col.status && dropTarget?.insertBeforeId === null && colTasks.length > 0 && (
                <div style={{ height: 3, borderRadius: 2, background: 'var(--accent)', margin: '0 2px' }} />
              )}
              {colTasks.length === 0 && !isColOver && (
                <div style={{ border: '1px dashed var(--border2)', borderRadius: 'var(--r)', padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No tasks</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────

type SortKey = 'title' | 'priority' | 'dueDate' | 'status' | 'assignee' | 'department';
type GroupBy  = 'department' | 'status' | 'none';

function ListView({ tasks, onEdit, onDelete, onTaskClick, onStatusChange }: {
  tasks: MyTask[];
  onEdit: (t: MyTask) => void;
  onDelete: (t: MyTask) => void;
  onTaskClick: (t: MyTask) => void;
  onStatusChange: (t: MyTask, s: TaskStatus) => void;
}) {
  const [sortKey,    setSortKey]    = useState<SortKey>('priority');
  const [sortAsc,    setSortAsc]    = useState(true);
  const [groupBy,    setGroupBy]    = useState<GroupBy>('department');
  const [flatPage,   setFlatPage]   = useState(1);
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  const [collapsed,  setCollapsed]  = useState<Set<string>>(new Set());

  const sorted = useMemo(() => [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'title')      cmp = a.title.localeCompare(b.title);
    if (sortKey === 'priority')   cmp = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (sortKey === 'dueDate')    cmp = (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
    if (sortKey === 'status')     cmp = a.status.localeCompare(b.status);
    if (sortKey === 'assignee')   cmp = a.assignee.localeCompare(b.assignee);
    if (sortKey === 'department') cmp = a.departmentName.localeCompare(b.departmentName);
    return sortAsc ? cmp : -cmp;
  }), [tasks, sortKey, sortAsc]);

  useEffect(() => { setFlatPage(1); setGroupPages({}); }, [tasks, groupBy, sortKey]);

  const groups = useMemo(() => {
    if (groupBy === 'department') {
      const map = new Map<string, MyTask[]>();
      sorted.forEach(t => {
        const k = t.departmentId || '__none';
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(t);
      });
      return [...map.entries()].map(([k, ts]) => ({
        key: k, label: `${ts[0].departmentIcon} ${ts[0].departmentName}`,
        color: ts[0].departmentColor, tasks: ts,
      }));
    }
    if (groupBy === 'status') {
      return STATUSES.map(s => ({ key: s, label: s, color: STATUS_COLOR[s], tasks: sorted.filter(t => t.status === s) })).filter(g => g.tasks.length > 0);
    }
    return [];
  }, [groupBy, sorted]);

  function changeSort(k: SortKey) { if (sortKey === k) setSortAsc(a => !a); else { setSortKey(k); setSortAsc(true); } }
  function getGroupPage(key: string) { return groupPages[key] ?? 1; }
  function setGroupPage(key: string, p: number) { setGroupPages(prev => ({ ...prev, [key]: p })); }
  function toggleGroup(label: string) { setCollapsed(prev => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; }); }

  const flatTotal = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const flatSafe  = Math.min(flatPage, flatTotal);
  const flatStart = (flatSafe - 1) * PAGE_SIZE;
  const flatTasks = sorted.slice(flatStart, flatStart + PAGE_SIZE);

  const thStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 };
  const SortArrow = ({ k }: { k: SortKey }) => <span style={{ marginLeft: 4, fontSize: 9, opacity: sortKey === k ? 0.7 : 0.2 }}>{sortKey === k ? (sortAsc ? '▲' : '▼') : '▲'}</span>;
  const gbStyle = (active: boolean): React.CSSProperties => ({ padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 99, background: active ? 'var(--bg4)' : 'transparent', border: active ? '1px solid var(--border2)' : '1px solid transparent', color: active ? 'var(--text)' : 'var(--text3)' });
  const pgBtn = (active: boolean, disabled = false): React.CSSProperties => ({ minWidth: 28, height: 26, padding: '0 6px', borderRadius: 'var(--r-xs)', fontSize: 11, fontWeight: active ? 700 : 400, cursor: disabled ? 'default' : 'pointer', background: active ? 'var(--accent)' : 'transparent', border: active ? 'none' : '1px solid transparent', color: active ? '#fff' : disabled ? 'var(--text3)' : 'var(--text2)', opacity: disabled ? 0.4 : 1 });

  function rowJsx(t: MyTask) {
    const overdue = isOverdue(t.dueDate, t.status);
    return (
      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
        onClick={() => onTaskClick(t)}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
        {/* Actions */}
        <td style={{ padding: '6px 8px', width: 68, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onEdit(t)} title="Edit"
              style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text2)' }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.color='var(--accent)'; b.style.borderColor='var(--accent)'; b.style.background='var(--accent-dim)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color='var(--text2)'; b.style.borderColor='var(--border2)'; b.style.background='transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => onDelete(t)} title="Delete"
              style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)' }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.color='var(--red)'; b.style.borderColor='var(--red)'; b.style.background='var(--red-dim)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color='var(--text3)'; b.style.borderColor='var(--border2)'; b.style.background='transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </td>
        {/* Title */}
        <td style={{ padding: '10px 8px', minWidth: 200 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.title}</span>
          {t.accountName && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{t.accountName}</div>}
        </td>
        {/* Department */}
        <td style={{ padding: '10px 8px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{t.departmentIcon} {t.departmentName}</td>
        {/* Priority */}
        <td style={{ padding: '10px 8px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, color: PRIORITY_COLOR[t.priority], background: PRIORITY_BG[t.priority], border: `1px solid ${PRIORITY_COLOR[t.priority]}33` }}>{t.priority}</span>
        </td>
        {/* Status (inline change) */}
        <td style={{ padding: '6px 8px' }} onClick={e => e.stopPropagation()}>
          <select value={t.status} onChange={e => onStatusChange(t, e.target.value as TaskStatus)}
            style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99, border: `1px solid ${STATUS_COLOR[t.status]}40`, background: STATUS_COLOR[t.status]+'18', color: STATUS_COLOR[t.status], cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', fontFamily: 'inherit' }}>
            {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--bg2)', color: 'var(--text)' }}>{s}</option>)}
          </select>
        </td>
        {/* Due */}
        <td style={{ padding: '10px 8px', fontSize: 12, whiteSpace: 'nowrap', color: overdue ? 'var(--red)' : 'var(--text3)', fontWeight: overdue ? 700 : 400 }}>
          {overdue ? '⚠ ' : ''}{fmtDate(t.dueDate)}
        </td>
        {/* Assignee */}
        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{t.assignee || '—'}</td>
      </tr>
    );
  }

  function groupHeaderJsx(g: { key: string; label: string; color: string; tasks: MyTask[] }) {
    const isCollapsed = collapsed.has(g.label);
    return (
      <tr key={g.key + '-hdr'}>
        <td colSpan={8} style={{ padding: 0, background: 'var(--bg3)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => toggleGroup(g.label)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--text3)', flexShrink: 0, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{g.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{g.tasks.length} task{g.tasks.length !== 1 ? 's' : ''}</span>
          </button>
        </td>
      </tr>
    );
  }

  function groupPagerJsx(g: { key: string; tasks: MyTask[] }) {
    const total = Math.ceil(g.tasks.length / PAGE_SIZE);
    if (total <= 1) return null;
    const cur = getGroupPage(g.key);
    return (
      <tr key={g.key + '-pg'}>
        <td colSpan={8} style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={pgBtn(false, cur === 1)} disabled={cur === 1} onClick={() => setGroupPage(g.key, cur - 1)}>‹</button>
            {Array.from({ length: total }, (_, i) => i + 1).map(n => <button key={n} style={pgBtn(n === cur)} onClick={() => setGroupPage(g.key, n)}>{n}</button>)}
            <button style={pgBtn(false, cur === total)} disabled={cur === total} onClick={() => setGroupPage(g.key, cur + 1)}>›</button>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>{(cur - 1) * PAGE_SIZE + 1}–{Math.min(cur * PAGE_SIZE, g.tasks.length)} of {g.tasks.length}</span>
          </div>
        </td>
      </tr>
    );
  }

  const allGroupLabels = groupBy === 'status' ? STATUSES : groups.map(g => g.label);
  const allCollapsed = allGroupLabels.length > 0 && allGroupLabels.every(k => collapsed.has(k));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sub-toolbar */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 2 }}>Group by</span>
        <button style={gbStyle(groupBy === 'department')} onClick={() => { setGroupBy('department'); setCollapsed(new Set()); setGroupPages({}); }}>Department</button>
        <button style={gbStyle(groupBy === 'status')}     onClick={() => { setGroupBy('status');     setCollapsed(new Set()); setGroupPages({}); }}>Status</button>
        <button style={gbStyle(groupBy === 'none')}       onClick={() => { setGroupBy('none');       setCollapsed(new Set()); setFlatPage(1); }}>None</button>
        {groupBy !== 'none' && (
          <>
            <span style={{ width: 1, height: 14, background: 'var(--border2)', margin: '0 4px' }} />
            <button onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(allGroupLabels))}
              style={{ fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px' }}>
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
          </>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
          {sorted.length} task{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>
      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 68, cursor: 'default' }} />
              <th style={thStyle} onClick={() => changeSort('title')}>Task <SortArrow k="title" /></th>
              <th style={thStyle} onClick={() => changeSort('department')}>Department <SortArrow k="department" /></th>
              <th style={thStyle} onClick={() => changeSort('priority')}>Priority <SortArrow k="priority" /></th>
              <th style={thStyle} onClick={() => changeSort('status')}>Status <SortArrow k="status" /></th>
              <th style={thStyle} onClick={() => changeSort('dueDate')}>Due <SortArrow k="dueDate" /></th>
              <th style={thStyle} onClick={() => changeSort('assignee')}>Assignee <SortArrow k="assignee" /></th>
            </tr>
          </thead>
          <tbody>
            {groupBy === 'none'
              ? flatTasks.map(rowJsx)
              : groups.map(g => {
                  const cur   = getGroupPage(g.key);
                  const start = (cur - 1) * PAGE_SIZE;
                  const page  = g.tasks.slice(start, start + PAGE_SIZE);
                  return (
                    <Fragment key={g.key}>
                      {groupHeaderJsx(g)}
                      {!collapsed.has(g.label) && page.map(rowJsx)}
                      {!collapsed.has(g.label) && groupPagerJsx(g)}
                    </Fragment>
                  );
                })}
          </tbody>
        </table>
        {sorted.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontSize: 13 }}>No tasks match the current filters.</div>}
      </div>
      {/* Flat pagination */}
      {groupBy === 'none' && flatTotal > 1 && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button style={pgBtn(false, flatSafe === 1)} disabled={flatSafe === 1} onClick={() => setFlatPage(p => p - 1)}>‹ Prev</button>
          {Array.from({ length: flatTotal }, (_, i) => i + 1).map(n => <button key={n} style={pgBtn(n === flatSafe)} onClick={() => setFlatPage(n)}>{n}</button>)}
          <button style={pgBtn(false, flatSafe === flatTotal)} disabled={flatSafe === flatTotal} onClick={() => setFlatPage(p => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MyTasksPage() {
  const [tasks,        setTasks]        = useState<MyTask[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [sessionName,  setSessionName]  = useState('');
  const [viewingUser,  setViewingUser]  = useState('');  // '' = self
  const [userInput,    setUserInput]    = useState('');
  const [view,         setView]         = useState<'list' | 'kanban'>('list');

  // Filters
  const [search,    setSearch]    = useState('');
  const [fDept,     setFDept]     = useState('');
  const [fStatus,   setFStatus]   = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fDue,      setFDue]      = useState('');

  // Modals
  const [editTask,   setEditTask]   = useState<MyTask | null>(null);
  const [deleteTask, setDeleteTask] = useState<MyTask | null>(null);
  const [drawerTask, setDrawerTask] = useState<MyTask | null>(null);

  const userName = viewingUser || sessionName;

  function loadTasks(assignee?: string) {
    setLoading(true);
    setError('');
    const url = assignee ? `/api/my-tasks?assignee=${encodeURIComponent(assignee)}` : '/api/my-tasks';
    fetch(url)
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setError('Failed to load tasks'); setLoading(false); });
  }

  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(d => setSessionName(d.user?.name ?? '')).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const assigneeParam = params.get('assignee') ?? '';
    if (assigneeParam) { setViewingUser(assigneeParam); setUserInput(assigneeParam); loadTasks(assigneeParam); }
    else loadTasks();
  }, []);

  const departments = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string }>();
    tasks.forEach(t => { if (t.departmentId) map.set(t.departmentId, { id: t.departmentId, name: t.departmentName, icon: t.departmentIcon }); });
    return [...map.values()];
  }, [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    if (fDept     && t.departmentId !== fDept)                       return false;
    if (fStatus   && t.status       !== fStatus)                     return false;
    if (fPriority && t.priority     !== fPriority)                   return false;
    if (fDue === 'overdue' && !isOverdue(t.dueDate, t.status))      return false;
    if (fDue === 'week') {
      const today = new Date(); today.setHours(0,0,0,0);
      const end = new Date(today); end.setDate(today.getDate() + 7);
      if (!t.dueDate || t.status === 'Done') return false;
      const d = new Date(t.dueDate);
      if (d < today || d > end) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.accountName.toLowerCase().includes(q) || t.departmentName.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    }
    return true;
  }), [tasks, fDept, fStatus, fPriority, fDue, search]);

  const counts = useMemo(() => ({
    total:      filtered.length,
    inProgress: filtered.filter(t => t.status === 'In progress').length,
    overdue:    filtered.filter(t => isOverdue(t.dueDate, t.status)).length,
    done:       filtered.filter(t => t.status === 'Done').length,
  }), [filtered]);

  const hasFilters = !!(search || fDept || fStatus || fPriority || fDue);

  function updateTask(updated: MyTask) {
    setTasks(ts => ts.map(t => t.id === updated.id ? updated : t));
    if (drawerTask?.id === updated.id) setDrawerTask(updated);
  }
  function removeTask(id: string) {
    setTasks(ts => ts.filter(t => t.id !== id));
    if (drawerTask?.id === id) setDrawerTask(null);
  }

  async function handleStatusChange(t: MyTask, newStatus: TaskStatus) {
    const updated = { ...t, status: newStatus };
    updateTask(updated);
    await patchTask(t, { status: newStatus });
  }

  const sel: React.CSSProperties = { padding: '6px 10px', fontSize: 12, fontWeight: 500, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', color: 'var(--text2)', cursor: 'pointer', outline: 'none' };
  const viewBtn = (active: boolean): React.CSSProperties => ({ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: active ? 'var(--bg4)' : 'transparent', border: active ? '1px solid var(--border2)' : '1px solid transparent', color: active ? 'var(--text)' : 'var(--text3)' });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Instrument Sans, sans-serif', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '4px 10px' }}>← Home</a>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', fontFamily: 'Poppins, sans-serif' }}>NEXUS</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {viewingUser ? `${viewingUser}'s Tasks` : 'My Tasks'}
        </span>
        {viewingUser && (
          <button onClick={() => { setViewingUser(''); setUserInput(''); loadTasks(); }}
            style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: '1px solid var(--accent)', borderRadius: 'var(--r-sm)', padding: '3px 8px', cursor: 'pointer' }}>
            ← Back to my tasks
          </button>
        )}
      </div>

      {/* User switcher */}
      <div style={{ padding: '12px 28px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>View tasks for:</span>
        <div style={{ width: 260 }}>
          <AssigneeAutocomplete
            value={userInput}
            onChange={name => setUserInput(name)}
            onSelect={name => { setViewingUser(name); loadTasks(name); }}
            placeholder="Search for a person…"
          />
        </div>
        {viewingUser && (
          <button onClick={() => { setViewingUser(''); setUserInput(''); loadTasks(); }}
            style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ✕ Back to my tasks
          </button>
        )}
        {!viewingUser && sessionName && (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Currently showing: <strong style={{ color: 'var(--text)' }}>{sessionName}</strong></span>
        )}
      </div>

      {/* Stats strip */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: 12, padding: '16px 28px 0', flexWrap: 'wrap', flexShrink: 0 }}>
          {[
            { label: 'Total',       value: counts.total,      color: 'var(--accent)' },
            { label: 'In Progress', value: counts.inProgress, color: 'var(--blue)' },
            { label: 'Overdue',     value: counts.overdue,    color: 'var(--red)' },
            { label: 'Done',        value: counts.done,       color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} style={{ flex: '1 1 100px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ padding: '12px 28px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 9, pointerEvents: 'none', color: 'var(--text3)' }}>
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input type="text" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...sel, paddingLeft: 28, width: 180, cursor: 'text' }} />
        </div>
        <select style={sel} value={fDept} onChange={e => setFDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
        </select>
        <select style={sel} value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={sel} value={fPriority} onChange={e => setFPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select style={sel} value={fDue} onChange={e => setFDue(e.target.value)}>
          <option value="">All due dates</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due this week</option>
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFDept(''); setFStatus(''); setFPriority(''); setFDue(''); }}
            style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 2px' }}>Clear all</button>
        )}
        <div style={{ flex: 1 }} />
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button style={viewBtn(view === 'list')}   onClick={() => setView('list')}   title="List view"><ListIcon /></button>
          <button style={viewBtn(view === 'kanban')} onClick={() => setView('kanban')} title="Kanban view"><KanbanIcon /></button>
        </div>
      </div>

      {/* Content */}
      {loading && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading your tasks…</div>}
      {error   && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'list'
            ? <ListView tasks={filtered} onEdit={setEditTask} onDelete={setDeleteTask} onTaskClick={setDrawerTask} onStatusChange={handleStatusChange} />
            : <KanbanView tasks={filtered} onEdit={setEditTask} onDelete={setDeleteTask} onTaskClick={setDrawerTask} onStatusChange={handleStatusChange} />
          }
        </div>
      )}

      {/* Modals */}
      {editTask   && <EditTaskModal   task={editTask}   onClose={() => setEditTask(null)}   onSave={t => { updateTask(t); setEditTask(null); }} />}
      {deleteTask && <DeleteConfirm   task={deleteTask} onClose={() => setDeleteTask(null)} onDelete={() => { removeTask(deleteTask.id); setDeleteTask(null); }} />}
      {drawerTask && <TaskDrawer      task={drawerTask} onClose={() => setDrawerTask(null)} onUpdate={updateTask} onDelete={() => removeTask(drawerTask.id)} />}
    </div>
  );
}
