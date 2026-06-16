'use client';
import { useState } from 'react';
import { Account, Opportunity, OppStage } from '@/lib/crmTypes';
import { useCrm } from '@/context/CrmContext';
import { useToast } from '@/context/ToastContext';

const STAGE_COLOR: Record<string, string> = {
  Prospecting: 'var(--text3)',
  Qualified: 'var(--blue)',
  Proposal: 'var(--purple)',
  Negotiation: 'var(--amber)',
  'Closed Won': 'var(--green)',
  'Closed Lost': 'var(--red)',
};

const STAGES: OppStage[] = ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

function fmtCurrency(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function OpportunitiesTab({ account }: { account: Account }) {
  const { dispatch } = useCrm();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId]   = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Opportunity>>({
    name: '', value: 0, stage: 'Prospecting', closeDate: '', probability: 50, description: '', nextStep: '',
  });

  function openAdd() {
    setForm({ name: '', value: 0, stage: 'Prospecting', closeDate: '', probability: 50, description: '', nextStep: '' });
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
      toast('Opportunity updated');
    } else {
      dispatch({ type: 'ADD_OPPORTUNITY', accountId: account.id, opportunity: { ...(form as Opportunity), id: `opp-${Date.now()}` } });
      toast('Opportunity added');
    }
    setAdding(false);
    setEditId(null);
  }

  function confirmDelete() {
    if (!delId) return;
    const name = account.opportunities.find(o => o.id === delId)?.name ?? 'Opportunity';
    dispatch({ type: 'DELETE_OPPORTUNITY', accountId: account.id, opportunityId: delId });
    toast(`${name} deleted`, 'info');
    setDelId(null);
  }

  const delTarget = delId ? account.opportunities.find(o => o.id === delId) : null;
  const totalPipeline = account.opportunities.filter(o => o.stage !== 'Closed Lost').reduce((s, o) => s + o.value * (o.probability / 100), 0);

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', fontSize: 13,
    padding: '8px 10px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weighted Pipeline</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{fmtCurrency(totalPipeline)}</div>
        </div>
        <button onClick={openAdd} style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
          + Add Opportunity
        </button>
      </div>

      {adding && (
        <>
          <div onClick={() => { setAdding(false); setEditId(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 500 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 520, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{editId ? 'Edit Opportunity' : 'New Opportunity'}</div>
              <button onClick={() => { setAdding(false); setEditId(null); }} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid transparent', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, transition: 'color 0.12s, border-color 0.12s' }} onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--text)'; b.style.borderColor = 'var(--border2)'; }} onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'transparent'; }}>×</button>
            </div>
            <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
              <div><label style={labelStyle}>Name *</label><input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Value ($)</label><input type="number" style={inputStyle} value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
                <div><label style={labelStyle}>Stage</label>
                  <select style={inputStyle} value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as OppStage }))}>
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Probability %</label><input type="number" min={0} max={100} style={inputStyle} value={form.probability} onChange={e => setForm(f => ({ ...f, probability: Number(e.target.value) }))} /></div>
              </div>
              <div><label style={labelStyle}>Expected Close Date</label><input type="date" style={inputStyle} value={form.closeDate} onChange={e => setForm(f => ({ ...f, closeDate: e.target.value }))} /></div>
              <div><label style={labelStyle}>Next Step</label><input style={inputStyle} placeholder="e.g. Send proposal by Friday" value={form.nextStep ?? ''} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))} /></div>
              <div><label style={labelStyle}>Description / Notes</label><textarea style={{ ...inputStyle, minHeight: 68, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{editId ? 'Update' : 'Add'}</button>
                <button type="button" onClick={() => { setAdding(false); setEditId(null); }} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {account.opportunities.map(opp => {
          const taskCount = account.tasks.filter(t => t.opportunityId === opp.id).length;
          const openTasks = account.tasks.filter(t => t.opportunityId === opp.id && t.status !== 'Done').length;
          const stageColor = STAGE_COLOR[opp.stage] ?? 'var(--text3)';
          return (
            <div key={opp.id} style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{opp.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, color: stageColor, background: stageColor + '1a', border: `1px solid ${stageColor}33` }}>{opp.stage}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Close: {fmtDate(opp.closeDate)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>P({opp.probability}%)</span>
                    {taskCount > 0 && <span style={{ fontSize: 12, color: openTasks > 0 ? 'var(--amber)' : 'var(--text3)' }}>{openTasks}/{taskCount} tasks open</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{fmtCurrency(opp.value)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>≈ {fmtCurrency(opp.value * (opp.probability / 100))} weighted</div>
                </div>
              </div>
              <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 99, marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${opp.probability}%`, background: stageColor, borderRadius: 99 }} />
              </div>
              {opp.nextStep
                ? <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8, padding: '6px 10px', background: 'var(--accent-dim)', borderRadius: 'var(--r-sm)', border: '1px solid var(--accent)33' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Next step</span>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{opp.nextStep}</span>
                  </div>
                : <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 10px', background: 'var(--red-dim)', borderRadius: 'var(--r-sm)', border: '1px solid var(--red)33' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)' }}>⚠ No next step defined</span>
                  </div>
              }
              {opp.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>{opp.description}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={() => openEdit(opp)} title="Edit opportunity"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text2)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--accent)'; b.style.borderColor = 'var(--accent)'; b.style.background = 'var(--accent-dim)'; }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text2)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={() => setDelId(opp.id)} title="Delete opportunity"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--red)'; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          );
        })}
        {account.opportunities.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No opportunities yet.</div>}
      </div>

      {/* Delete modal */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDelId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete opportunity?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}><strong style={{ color: 'var(--text)' }}>{delTarget.name}</strong> will be permanently deleted.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelId(null)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
