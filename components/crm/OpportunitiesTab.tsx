'use client';
import { useState } from 'react';
import { Account, Opportunity, OppStage } from '@/lib/crmTypes';
import { useCrm } from '@/context/CrmContext';

const STAGE_COLOR: Record<OppStage, string> = {
  Prospecting: 'var(--text3)',
  Qualified: 'var(--blue)',
  Proposal: 'var(--purple)',
  Negotiation: 'var(--amber)',
  'Closed Won': 'var(--green)',
  'Closed Lost': 'var(--red)',
};

const STAGES: OppStage[] = ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OpportunitiesTab({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Opportunity>>({
    name: '', value: 0, stage: 'Prospecting', closeDate: '', probability: 50, description: '',
  });

  function openAdd() {
    setForm({ name: '', value: 0, stage: 'Prospecting', closeDate: '', probability: 50, description: '' });
    setEditId(null);
    setAdding(true);
  }

  function openEdit(opp: Opportunity) {
    setForm({ ...opp });
    setEditId(opp.id);
    setAdding(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    if (editId) {
      dispatch({ type: 'UPDATE_OPPORTUNITY', accountId: account.id, opportunity: { ...(form as Opportunity), id: editId } });
    } else {
      dispatch({ type: 'ADD_OPPORTUNITY', accountId: account.id, opportunity: { ...(form as Opportunity), id: `opp-${Date.now()}` } });
    }
    setAdding(false);
    setEditId(null);
  }

  const totalPipeline = account.opportunities
    .filter(o => o.stage !== 'Closed Lost')
    .reduce((s, o) => s + o.value * (o.probability / 100), 0);

  const inputStyle = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 13,
    padding: '8px 10px', outline: 'none', boxSizing: 'border-box' as const,
  };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase' as const, letterSpacing: '0.06em' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weighted Pipeline</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
            {fmtCurrency(totalPipeline)}
          </div>
        </div>
        <button
          onClick={openAdd}
          style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
        >
          + Add Opportunity
        </button>
      </div>

      {adding && (
        <form onSubmit={submit} style={{ padding: 16, background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>
            {editId ? 'Edit Opportunity' : 'New Opportunity'}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Value (₹)</label>
                <input type="number" style={inputStyle} value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Stage</label>
                <select style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as OppStage }))}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Probability %</label>
                <input type="number" min={0} max={100} style={inputStyle} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Expected Close Date</label>
              <input type="date" style={inputStyle} value={form.closeDate} onChange={e => setForm(f => ({ ...f, closeDate: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, height: 60, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="submit" style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              {editId ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={() => { setAdding(false); setEditId(null); }} style={{ padding: '7px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 12, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {account.opportunities.map(opp => {
          const taskCount = account.tasks.filter(t => t.opportunityId === opp.id).length;
          const openTasks = account.tasks.filter(t => t.opportunityId === opp.id && t.status !== 'Done').length;
          return (
            <div key={opp.id} style={{
              padding: '14px 16px', background: 'var(--bg3)',
              borderRadius: 'var(--r)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{opp.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      color: STAGE_COLOR[opp.stage], background: STAGE_COLOR[opp.stage] + '1a',
                      border: `1px solid ${STAGE_COLOR[opp.stage]}33`,
                    }}>
                      {opp.stage}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Close: {fmtDate(opp.closeDate)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>P({opp.probability}%)</span>
                    {taskCount > 0 && (
                      <span style={{ fontSize: 12, color: openTasks > 0 ? 'var(--amber)' : 'var(--text3)' }}>
                        {openTasks}/{taskCount} tasks open
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                    {fmtCurrency(opp.value)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    ≈ {fmtCurrency(opp.value * (opp.probability / 100))} weighted
                  </div>
                </div>
              </div>

              {/* probability bar */}
              <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 99, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${opp.probability}%`, background: STAGE_COLOR[opp.stage], borderRadius: 99 }} />
              </div>

              {opp.description && (
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{opp.description}</div>
              )}

              <button
                onClick={() => openEdit(opp)}
                style={{ marginTop: 10, padding: '4px 10px', background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', fontSize: 11, cursor: 'pointer' }}
              >
                Edit
              </button>
            </div>
          );
        })}

        {account.opportunities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>
            No opportunities yet. Add one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
