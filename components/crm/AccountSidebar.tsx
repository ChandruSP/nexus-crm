'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Account } from '@/lib/crmTypes';

const SEGMENT_COLOR: Record<string, string> = {
  Enterprise: 'var(--purple)',
  'Mid-Market': 'var(--blue)',
  SMB: 'var(--green)',
};

const BLANK = { name: '', industry: '', segment: 'Enterprise', owner: '', location: '', website: '' };

export function AccountSidebar() {
  const { state, dispatch } = useCrm();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [error, setError] = useState('');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Account name is required.'); return; }
    const id = `acc-${Date.now()}`;
    const account: Account = {
      id,
      name: form.name.trim(),
      industry: form.industry.trim() || 'Unknown',
      segment: form.segment as Account['segment'],
      owner: form.owner.trim() || '—',
      location: form.location.trim() || '—',
      website: form.website.trim() || undefined,
      description: '',
      stakeholders: [],
      pastProjects: [],
      opportunities: [],
      tasks: [],
    };
    dispatch({ type: 'ADD_ACCOUNT', account });
    setAdding(false);
    setForm({ ...BLANK });
    setError('');
  }

  function cancel() { setAdding(false); setForm({ ...BLANK }); setError(''); }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 'var(--r-sm)',
    background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <aside style={{
      width: 260, minWidth: 260,
      background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>
            Accounts
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Serif Display, serif' }}>
            {state.accounts.length} Accounts
          </div>
        </div>
        <button
          onClick={() => setAdding(a => !a)}
          title="Add account"
          style={{
            width: 28, height: 28, borderRadius: 'var(--r-sm)', border: '1px solid var(--border2)',
            background: adding ? 'var(--accent-dim)' : 'var(--bg3)',
            color: adding ? 'var(--accent)' : 'var(--text3)',
            cursor: 'pointer', fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 300, flexShrink: 0, marginBottom: 2,
          }}
        >
          +
        </button>
      </div>

      {/* Add Account form */}
      {adding && (
        <form onSubmit={submit} style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 7, background: 'var(--bg3)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>New Account</div>

          <input style={inputStyle} placeholder="Account name *" value={form.name}
            onChange={e => set('name', e.target.value)} autoFocus />
          {error && <div style={{ fontSize: 11, color: 'var(--red)' }}>{error}</div>}

          <input style={inputStyle} placeholder="Industry" value={form.industry}
            onChange={e => set('industry', e.target.value)} />

          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.segment}
            onChange={e => set('segment', e.target.value)}>
            <option value="Enterprise">Enterprise</option>
            <option value="Mid-Market">Mid-Market</option>
            <option value="SMB">SMB</option>
          </select>

          <input style={inputStyle} placeholder="Owner" value={form.owner}
            onChange={e => set('owner', e.target.value)} />

          <input style={inputStyle} placeholder="Location" value={form.location}
            onChange={e => set('location', e.target.value)} />

          <input style={inputStyle} placeholder="Website" value={form.website}
            onChange={e => set('website', e.target.value)} />

          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <button type="submit" style={{
              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)',
            }}>
              Add
            </button>
            <button type="button" onClick={cancel} style={{
              flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: 'var(--bg4)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)',
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Account list */}
      <div style={{ flex: 1, padding: '8px 8px' }}>
        {state.accounts.map(acc => {
          const selected  = acc.id === state.selectedAccountId;
          const openTasks = acc.tasks.filter(t => t.status !== 'Done').length;
          const critTasks = acc.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;

          return (
            <button key={acc.id} onClick={() => dispatch({ type: 'SELECT_ACCOUNT', id: acc.id })}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--r-sm)',
                background: selected ? 'var(--bg4)' : 'transparent',
                border: selected ? '1px solid var(--border2)' : '1px solid transparent',
                cursor: 'pointer', marginBottom: 2, transition: 'background 0.12s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                  {acc.name}
                </span>
                {critTasks > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', borderRadius: 99, padding: '1px 6px', flexShrink: 0 }}>
                    {critTasks} critical
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{acc.industry}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: SEGMENT_COLOR[acc.segment], background: SEGMENT_COLOR[acc.segment] + '18', borderRadius: 99, padding: '1px 6px' }}>
                  {acc.segment}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {openTasks} open task{openTasks !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
