'use client';
import { useState } from 'react';
import { Account, Stakeholder } from '@/lib/crmTypes';
import { useCrm } from '@/context/CrmContext';

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['var(--purple)', 'var(--blue)', 'var(--green)', 'var(--amber)', 'var(--accent)'];

export function StakeholdersTab({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', notes: '', isPrimary: false });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    dispatch({
      type: 'ADD_STAKEHOLDER',
      accountId: account.id,
      stakeholder: { id: `s-${Date.now()}`, ...form },
    });
    setForm({ name: '', role: '', email: '', phone: '', notes: '', isPrimary: false });
    setAdding(false);
  }

  const inputStyle = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 13,
    padding: '8px 10px', outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button
          onClick={() => setAdding(a => !a)}
          style={{ padding: '6px 12px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          + Add Stakeholder
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} style={{ padding: 16, background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>New Stakeholder</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Role / Title *</label>
                <input style={inputStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))} />
              Primary contact
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="submit" style={{ padding: '7px 16px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {account.stakeholders.map((s, i) => (
          <div key={s.id} style={{
            display: 'flex', gap: 14, padding: '14px 16px',
            background: 'var(--bg3)', borderRadius: 'var(--r)',
            border: s.isPrimary ? '1px solid var(--border2)' : '1px solid var(--border)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: AVATAR_COLORS[i % AVATAR_COLORS.length] + '22',
              border: `1.5px solid ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              color: AVATAR_COLORS[i % AVATAR_COLORS.length],
            }}>
              {initials(s.name)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                {s.isPrimary && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: 99, padding: '1px 6px' }}>
                    Primary
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{s.role}</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {s.email && <a href={`mailto:${s.email}`} style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none' }}>{s.email}</a>}
                {s.phone && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{s.phone}</span>}
              </div>
              {s.notes && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', fontStyle: 'italic' }}>
                  {s.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
