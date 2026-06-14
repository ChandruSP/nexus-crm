'use client';
import { useState, useRef } from 'react';
import { Account, PastProject, Attachment } from '@/lib/crmTypes';
import { useCrm } from '@/context/CrmContext';
import { useToast } from '@/context/ToastContext';

function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
const STATUS_COLOR: Record<string, string> = { Completed: 'var(--green)', Ongoing: 'var(--blue)', Cancelled: 'var(--red)' };

type PRForm = { name: string; year: string; status: 'Completed'|'Ongoing'|'Cancelled'; revenue: string; description: string };
const blank = (): PRForm => ({ name: '', year: String(new Date().getFullYear()), status: 'Completed', revenue: '', description: '' });
const fromProject = (p: PastProject): PRForm => ({ name: p.name, year: String(p.year), status: p.status, revenue: String(p.revenue / 100000), description: p.description ?? '' });

const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, display: 'block' };

function ProjectForm({ initial, onSave, onCancel, title }: { initial: PRForm; onSave: (f: PRForm) => void; onCancel: () => void; title: string }) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof PRForm, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 480, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
          <button onClick={onCancel} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid transparent', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, transition: 'color 0.12s, border-color 0.12s' }} onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--text)'; b.style.borderColor = 'var(--border2)'; }} onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'transparent'; }}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (!form.name.trim()) return; onSave(form); }} style={{ display: 'grid', gap: 12 }}>
          <div><span style={lbl}>Project Name *</span><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><span style={lbl}>Year</span><input type="number" style={inp} min="2000" max="2100" value={form.year} onChange={e => set('year', e.target.value)} /></div>
            <div><span style={lbl}>Status</span>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value as PRForm['status'])}>
                <option>Completed</option><option>Ongoing</option><option>Cancelled</option>
              </select>
            </div>
            <div><span style={lbl}>Revenue (₹ Lakhs)</span><input type="number" style={inp} min="0" step="0.1" value={form.revenue} onChange={e => set('revenue', e.target.value)} placeholder="e.g. 48" /></div>
          </div>
          <div><span style={lbl}>Description</span><textarea style={{ ...inp, resize: 'vertical', minHeight: 68, lineHeight: 1.5 }} value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save</button>
            <button type="button" onClick={onCancel} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


export function OverviewTab({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const { toast }    = useToast();
  const [addingPR, setAddingPR] = useState(false);
  const [editPRId, setEditPRId] = useState<string | null>(null);
  const [delPRId, setDelPRId]   = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalRevenue  = account.pastProjects.reduce((s, p) => s + p.revenue, 0);
  const openOpp       = account.opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost');
  const totalPipeline = openOpp.reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const openTasks     = account.tasks.filter(t => t.status !== 'Done').length;
  const critTasks     = account.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;

  function saveProject(id: string | null, form: PRForm) {
    const project = { id: id ?? `pr-${Date.now()}`, name: form.name.trim(), year: parseInt(form.year) || new Date().getFullYear(), status: form.status, revenue: Math.round(parseFloat(form.revenue || '0') * 100000), description: form.description.trim() || undefined };
    if (id) {
      dispatch({ type: 'UPDATE_PAST_PROJECT', accountId: account.id, project });
      toast('Project updated');
      setEditPRId(null);
    } else {
      dispatch({ type: 'ADD_PAST_PROJECT', accountId: account.id, project });
      toast('Project added');
      setAddingPR(false);
    }
  }

  function confirmDelPR() {
    if (!delPRId) return;
    const name = account.pastProjects.find(p => p.id === delPRId)?.name ?? 'Project';
    dispatch({ type: 'DELETE_PAST_PROJECT', accountId: account.id, projectId: delPRId });
    toast(`${name} removed`, 'info');
    setDelPRId(null);
  }

  const delPRTarget = delPRId ? account.pastProjects.find(p => p.id === delPRId) : null;
  const sortedProjects = [...account.pastProjects].sort((a, b) => b.year - a.year);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast(`${file.name} is too large (max 10 MB)`, 'error'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const att: Attachment = { id: `att-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: file.name, size: file.size, type: file.type, dataUrl: reader.result as string, uploadedAt: Date.now() };
        dispatch({ type: 'ADD_ATTACHMENT', accountId: account.id, attachment: att });
        toast(`${file.name} uploaded`);
      };
      reader.readAsDataURL(file);
    });
  }

  function deleteAttachment(id: string, name: string) {
    dispatch({ type: 'DELETE_ATTACHMENT', accountId: account.id, attachmentId: id });
    toast(`${name} removed`, 'info');
  }

  return (
    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

      {/* ── Left ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {account.description && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>About</div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>{account.description}</p>
          </div>
        )}

        {/* Past Projects */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Past Projects</div>
            <button onClick={() => { setAddingPR(a => !a); setEditPRId(null); }}
              style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-xs)', cursor: 'pointer' }}>
              + Add Project
            </button>
          </div>

          {addingPR && <ProjectForm initial={blank()} title="New Past Project" onSave={f => saveProject(null, f)} onCancel={() => setAddingPR(false)} />}

          {account.pastProjects.length === 0 && !addingPR && (
            <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px 0' }}>No past projects recorded.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {sortedProjects.map((p, i, arr) => (
              <div key={p.id}>
                {editPRId === p.id ? (
                  <ProjectForm initial={fromProject(p)} title={`Edit — ${p.name}`} onSave={f => saveProject(p.id, f)} onCancel={() => setEditPRId(null)} />
                ) : (
                  <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0, paddingTop: 2 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[p.status], flexShrink: 0, zIndex: 1 }} />
                      {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border2)', marginTop: 4, minHeight: 24 }} />}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[p.status], background: STATUS_COLOR[p.status] + '18', borderRadius: 99, padding: '1px 6px' }}>{p.status}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmtCurrency(p.revenue)}</span>
                          <button onClick={() => { setEditPRId(p.id); setAddingPR(false); }} title="Edit project"
                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text2)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                            onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--accent)'; b.style.borderColor = 'var(--accent)'; b.style.background = 'var(--accent-dim)'; }}
                            onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text2)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button onClick={() => setDelPRId(p.id)} title="Delete project"
                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                            onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--red)'; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
                            onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{p.year}</div>
                      {p.description && <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{p.description}</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Attachments ── */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Attachments {(account.attachments?.length ?? 0) > 0 && <span style={{ fontWeight: 400, color: 'var(--text3)' }}>({account.attachments!.length})</span>}
            </div>
            <button onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-xs)', cursor: 'pointer' }}>
              + Upload
            </button>
          </div>

          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 'var(--r)', padding: '16px', textAlign: 'center', cursor: 'pointer',
              background: dragActive ? 'var(--accent-dim)' : 'transparent',
              transition: 'all 0.15s', marginBottom: (account.attachments?.length ?? 0) > 0 ? 12 : 0,
              display: (account.attachments?.length ?? 0) > 0 ? 'none' : 'block',
            }}>
            <div style={{ marginBottom: 8, color: 'var(--text3)', display: 'flex', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 20V10M14 10l-4 4M14 10l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="18" width="22" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" opacity="0.4"/></svg>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Drop files here or click to upload</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, opacity: 0.7 }}>Max 10 MB per file</div>
          </div>

          {(account.attachments?.length ?? 0) > 0 && (
            <div>
              {/* Drop hint when files exist */}
              <div
                onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {account.attachments!.map(att => (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ flexShrink: 0, color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="2" width="9" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M5.5 9h5M5.5 11.5h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{formatSize(att.size)} · {new Date(att.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                    </div>
                    <a href={att.dataUrl} download={att.name} title="Download"
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-xs)', cursor: 'pointer', textDecoration: 'none', flexShrink: 0, color: 'var(--accent)', transition: 'background 0.12s' }}
                      onClick={e => e.stopPropagation()}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v7M7 9l-3-3M7 9l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    </a>
                    <button onClick={() => deleteAttachment(att.id, att.name)} title="Remove attachment"
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', flexShrink: 0, transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                      onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--red)'; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
                      onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: stats + quick facts ── */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          {[
            { label: 'Total Revenue',     value: fmtCurrency(totalRevenue),  color: 'var(--text)' },
            { label: 'Weighted Pipeline', value: fmtCurrency(totalPipeline), color: 'var(--accent)' },
            { label: 'Open Tasks',        value: openTasks,                  color: openTasks > 0 ? 'var(--amber)' : 'var(--text3)' },
            { label: 'Critical Tasks',    value: critTasks,                  color: critTasks > 0 ? 'var(--red)' : 'var(--text3)' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Facts</span>
          </div>
          {[
            { label: 'Industry',  value: account.industry },
            { label: 'Segment',   value: account.segment },
            { label: 'Location',  value: account.location },
            { label: 'Owner',     value: account.owner },
            { label: 'Projects',  value: account.pastProjects.length },
            { label: 'People',    value: account.stakeholders.length },
          ].filter(f => f.value !== '' && f.value !== undefined).map((f, i, arr) => (
            <div key={f.label} style={{ padding: '9px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{f.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textAlign: 'right' }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Delete project modal */}
      {delPRTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDelPRId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Remove project?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>{delPRTarget.name}</strong> will be permanently removed.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelPRId(null)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
              <button onClick={confirmDelPR} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
