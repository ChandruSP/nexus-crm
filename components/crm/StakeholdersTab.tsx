'use client';
import { useState } from 'react';
import { Account, Stakeholder } from '@/lib/crmTypes';
import { useCrm } from '@/context/CrmContext';
import { useToast } from '@/context/ToastContext';

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}
const AVATAR_COLORS = ['var(--purple)', 'var(--blue)', 'var(--green)', 'var(--amber)', 'var(--accent)'];

type BlankForm = { name: string; role: string; email: string; phone: string; whatsapp: boolean; notes: string; isPrimary: boolean };
const blank = (): BlankForm => ({ name: '', role: '', email: '', phone: '', whatsapp: false, notes: '', isPrimary: false });
function fromStakeholder(s: Stakeholder): BlankForm {
  return { name: s.name, role: s.role, email: s.email, phone: s.phone ?? '', whatsapp: s.whatsapp ?? false, notes: s.notes ?? '', isPrimary: s.isPrimary ?? false };
}

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)',
  borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 13,
  padding: '8px 10px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};
const label: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };

function StakeholderForm({ initial, onSave, onCancel, title }: { initial: BlankForm; onSave: (f: BlankForm) => void; onCancel: () => void; title: string }) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof BlankForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 520, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
          <button onClick={onCancel} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid transparent', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, transition: 'color 0.12s, border-color 0.12s' }} onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--text)'; b.style.borderColor = 'var(--border2)'; }} onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'transparent'; }}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (!form.name.trim() || !form.role.trim()) return; onSave(form); }} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
            <div><span style={label}>Name *</span><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} autoFocus placeholder="Full name" /></div>
            <div><span style={label}>Role / Title *</span><input style={inp} value={form.role} onChange={e => set('role', e.target.value)} placeholder="e.g. CTO" /></div>
            <div><span style={label}>Email</span><input type="email" style={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@company.com" /></div>
            <div><span style={label}>Phone</span><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 20, padding: '4px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={form.whatsapp} onChange={e => set('whatsapp', e.target.checked)} style={{ accentColor: 'var(--green)', width: 14, height: 14 }} />
                Reachable on WhatsApp
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={form.isPrimary} onChange={e => set('isPrimary', e.target.checked)} style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
                Primary contact
              </label>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <span style={label}>Notes</span>
              <textarea style={{ ...inp, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Relationship notes, preferences…" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save</button>
            <button type="button" onClick={onCancel} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

export function StakeholdersTab({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const { toast } = useToast();
  const [adding, setAdding]         = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [delId, setDelId]           = useState<string | null>(null);

  function addStakeholder(form: BlankForm) {
    dispatch({ type: 'ADD_STAKEHOLDER', accountId: account.id, stakeholder: { id: `s-${Date.now()}`, name: form.name.trim(), role: form.role.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, whatsapp: form.whatsapp || undefined, notes: form.notes.trim() || undefined, isPrimary: form.isPrimary } });
    toast('Stakeholder added');
    setAdding(false);
  }

  function updateStakeholder(id: string, form: BlankForm) {
    const existing = account.stakeholders.find(s => s.id === id)!;
    dispatch({ type: 'UPDATE_STAKEHOLDER', accountId: account.id, stakeholder: { ...existing, name: form.name.trim(), role: form.role.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, whatsapp: form.whatsapp || undefined, notes: form.notes.trim() || undefined, isPrimary: form.isPrimary } });
    toast('Stakeholder updated');
    setEditId(null);
  }

  function confirmDelete() {
    if (!delId) return;
    const name = account.stakeholders.find(s => s.id === delId)?.name ?? 'Stakeholder';
    dispatch({ type: 'DELETE_STAKEHOLDER', accountId: account.id, stakeholderId: delId });
    toast(`${name} removed`, 'info');
    setDelId(null);
  }

  const delTarget = delId ? account.stakeholders.find(s => s.id === delId) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => { setAdding(a => !a); setEditId(null); }}
          style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          + Add Stakeholder
        </button>
      </div>

      {adding && <StakeholderForm initial={blank()} title="New Stakeholder" onSave={addStakeholder} onCancel={() => setAdding(false)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 12 }}>
        {account.stakeholders.map((s, i) => (
          <div key={s.id}>
            {editId === s.id ? (
              <StakeholderForm initial={fromStakeholder(s)} title={`Edit — ${s.name}`} onSave={f => updateStakeholder(s.id, f)} onCancel={() => setEditId(null)} />
            ) : (
              <div style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: s.isPrimary ? '1px solid var(--border2)' : '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22', border: `1.5px solid ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {initials(s.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                    {s.isPrimary && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: 99, padding: '1px 6px' }}>Primary</span>}
                    {s.whatsapp && (
                      <span title="Reachable on WhatsApp" style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', borderRadius: 99, padding: '1px 6px' }}>
                        WhatsApp ✓
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{s.role}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                    {s.email && <a href={`mailto:${s.email}`} style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>{s.email}</a>}
                    {s.phone && (
                      <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {s.phone}
                        {s.whatsapp && <span style={{ fontSize: 10, color: 'var(--green)' }}>· WA</span>}
                      </span>
                    )}
                  </div>
                  {s.notes && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', fontStyle: 'italic' }}>{s.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'flex-start' }}>
                  <button onClick={() => { setEditId(s.id); setAdding(false); }} title="Edit stakeholder"
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text2)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--accent)'; b.style.borderColor = 'var(--accent)'; b.style.background = 'var(--accent-dim)'; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text2)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button onClick={() => setDelId(s.id)} title="Delete stakeholder"
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                    onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--red)'; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
                    onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {account.stakeholders.length === 0 && !adding && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No stakeholders yet.</div>
        )}
      </div>

      {/* Delete modal */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDelId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Remove stakeholder?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              <strong style={{ color: 'var(--text)' }}>{delTarget.name}</strong> will be removed from this account.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelId(null)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
