'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Account, OppStage } from '@/lib/crmTypes';

const STAGES: OppStage[] = ['Prospecting','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'];

interface Props { account: Account; onDone: () => void; onCancel: () => void; }

export function EditAccountPanel({ account, onDone, onCancel }: Props) {
  const { dispatch } = useCrm();

  const [basic, setBasic] = useState({
    name: account.name, industry: account.industry,
    segment: account.segment, owner: account.owner,
    location: account.location ?? '', website: account.website ?? '',
    description: account.description,
  });
  const setB = (k: string, v: string) => setBasic(f => ({ ...f, [k]: v }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!basic.name.trim())     e.name     = 'Required';
    if (!basic.industry.trim()) e.industry = 'Required';
    if (!basic.owner.trim())    e.owner    = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    dispatch({
      type: 'UPDATE_ACCOUNT',
      account: {
        ...account,
        name: basic.name.trim(),
        industry: basic.industry.trim(),
        segment: basic.segment as Account['segment'],
        owner: basic.owner.trim(),
        location: basic.location.trim() || '—',
        website: basic.website.trim() || undefined,
        description: basic.description.trim(),
      },
    });
    onDone();
  }

  const inp = (err?: boolean): React.CSSProperties => ({
    width: '100%', padding: '8px 11px', fontSize: 13, borderRadius: 'var(--r-sm)',
    background: 'var(--bg)', border: `1px solid ${err ? 'var(--red)' : 'var(--border2)'}`,
    color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  });
  const sel = (): React.CSSProperties => ({ ...inp(), cursor: 'pointer' });
  const area = (): React.CSSProperties => ({ ...inp(), resize: 'vertical', minHeight: 80, lineHeight: 1.6 });

  function Label({ t, req }: { t: string; req?: boolean }) {
    return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{t}{req && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}</div>;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <div style={{ padding: '18px 32px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Editing Account</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{account.name}</h2>
        </div>
        <button onClick={onCancel} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '6px 14px', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>

      <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ maxWidth: 780 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Basic Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
            <div>
              <Label t="Account Name" req />
              <input style={inp(!!errors.name)} value={basic.name} onChange={e => setB('name', e.target.value)} autoFocus />
              {errors.name && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.name}</div>}
            </div>
            <div>
              <Label t="Industry" req />
              <input style={inp(!!errors.industry)} value={basic.industry} onChange={e => setB('industry', e.target.value)} />
              {errors.industry && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.industry}</div>}
            </div>
            <div>
              <Label t="Segment" />
              <select style={sel()} value={basic.segment} onChange={e => setB('segment', e.target.value)}>
                <option>Enterprise</option><option>Mid-Market</option><option>SMB</option>
              </select>
            </div>
            <div>
              <Label t="Account Owner" req />
              <input style={inp(!!errors.owner)} value={basic.owner} onChange={e => setB('owner', e.target.value)} />
              {errors.owner && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.owner}</div>}
            </div>
            <div>
              <Label t="Location" />
              <input style={inp()} value={basic.location} onChange={e => setB('location', e.target.value)} />
            </div>
            <div>
              <Label t="Website" />
              <input style={inp()} value={basic.website} onChange={e => setB('website', e.target.value)} placeholder="e.g. acme.com" />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <Label t="Account Description" />
            <textarea style={area()} value={basic.description} onChange={e => setB('description', e.target.value)}
              placeholder="Key relationships, strategic context, decision-making structure…" />
          </div>

          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 20, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
            To edit stakeholders, past projects, and opportunities, use the respective tabs in the account detail view.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <button type="submit" style={{ padding: '10px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>
              Save Changes
            </button>
            <button type="button" onClick={onCancel} style={{ padding: '10px 20px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
