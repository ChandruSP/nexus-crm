'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Account } from '@/lib/crmTypes';

const BLANK = {
  name: '', industry: '', segment: 'Enterprise', owner: '', location: '', website: '', description: '',
};

interface Props { onDone: () => void; }

export function NewAccountPanel({ onDone }: Props) {
  const { dispatch } = useCrm();
  const [form, setForm] = useState({ ...BLANK });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = 'Account name is required';
    if (!form.industry.trim()) e.industry = 'Industry is required';
    if (!form.owner.trim())    e.owner    = 'Owner is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const account: Account = {
      id:           `acc-${Date.now()}`,
      name:         form.name.trim(),
      industry:     form.industry.trim(),
      segment:      form.segment as Account['segment'],
      owner:        form.owner.trim(),
      location:     form.location.trim() || '—',
      website:      form.website.trim() || undefined,
      description:  form.description.trim(),
      stakeholders: [],
      pastProjects: [],
      opportunities:[],
      tasks:        [],
    };
    dispatch({ type: 'ADD_ACCOUNT', account });
    onDone();
  }

  const inp = (hasError: boolean): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 'var(--r-sm)',
    background: 'var(--bg)', border: `1px solid ${hasError ? 'var(--red)' : 'var(--border2)'}`,
    color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  });

  const label = (text: string, required?: boolean): React.ReactNode => (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
      {text}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
    </div>
  );

  const field = (children: React.ReactNode, err?: string) => (
    <div>
      {children}
      {err && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{err}</div>}
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Panel header */}
      <div style={{ padding: '20px 32px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>New Account</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Serif Display, serif' }}>
            Add Account Details
          </h2>
        </div>
        <button onClick={onDone} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '6px 14px', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>

      {/* Form body */}
      <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ maxWidth: 700 }}>

          {/* Section: Basic Info */}
          <div style={{ marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Basic Information</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 28 }}>
            {field(<>{label('Account Name', true)}<input style={inp(!!errors.name)} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Acme Corporation" autoFocus /></>, errors.name)}
            {field(<>{label('Industry', true)}<input style={inp(!!errors.industry)} value={form.industry} onChange={e => set('industry', e.target.value)} placeholder="e.g. Financial Services" /></>, errors.industry)}

            <div>
              {label('Segment')}
              <select style={inp(false)} value={form.segment} onChange={e => set('segment', e.target.value)}>
                <option value="Enterprise">Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="SMB">SMB</option>
              </select>
            </div>

            {field(<>{label('Account Owner', true)}<input style={inp(!!errors.owner)} value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="e.g. Priya Nair" /></>, errors.owner)}

            <div>
              {label('Location')}
              <input style={inp(false)} value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Mumbai, India" />
            </div>

            <div>
              {label('Website')}
              <input style={inp(false)} value={form.website} onChange={e => set('website', e.target.value)} placeholder="e.g. acme.com" />
            </div>
          </div>

          {/* Section: Description */}
          <div style={{ marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Overview</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            {label('Description')}
            <textarea
              style={{ ...inp(false), resize: 'vertical', minHeight: 100, lineHeight: 1.6, fontFamily: 'inherit' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the account — key decision makers, relationship status, strategic context…"
            />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              You can add stakeholders, past projects, and opportunities after creating the account.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{
              padding: '10px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)',
            }}>
              Create Account
            </button>
            <button type="button" onClick={onDone} style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)',
            }}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
