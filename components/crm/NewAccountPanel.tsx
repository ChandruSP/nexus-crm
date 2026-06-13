'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Account, OppStage } from '@/lib/crmTypes';

/* ── draft types ─────────────────────────────────────────────── */
interface SKDraft { name: string; role: string; email: string; phone: string; notes: string; isPrimary: boolean; }
interface PRDraft { name: string; year: string; status: 'Completed'|'Ongoing'|'Cancelled'; revenue: string; description: string; }
interface OPDraft { name: string; stage: OppStage; value: string; probability: string; closeDate: string; description: string; }

const blankSK  = (): SKDraft => ({ name:'', role:'', email:'', phone:'', notes:'', isPrimary: false });
const blankPR  = (): PRDraft => ({ name:'', year: String(new Date().getFullYear()), status:'Completed', revenue:'', description:'' });
const blankOP  = (): OPDraft => ({ name:'', stage:'Prospecting', value:'', probability:'20', closeDate:'', description:'' });

const STAGES: OppStage[] = ['Prospecting','Qualified','Proposal','Negotiation','Closed Won','Closed Lost'];

interface Props { onDone: () => void; onCancel: () => void; }

export function NewAccountPanel({ onDone, onCancel }: Props) {
  const { dispatch } = useCrm();

  /* basic */
  const [basic, setBasic] = useState({ name:'', industry:'', segment:'Enterprise', owner:'', location:'', website:'', description:'' });
  const setB = (k: string, v: string) => setBasic(f => ({ ...f, [k]: v }));

  /* stakeholders */
  const [stakeholders, setStakeholders] = useState<SKDraft[]>([]);
  const setSK = (i: number, k: keyof SKDraft, v: string|boolean) =>
    setStakeholders(list => list.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const removeSK = (i: number) => setStakeholders(list => list.filter((_, idx) => idx !== i));

  /* past projects */
  const [projects, setProjects] = useState<PRDraft[]>([]);
  const setPR = (i: number, k: keyof PRDraft, v: string) =>
    setProjects(list => list.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  const removePR = (i: number) => setProjects(list => list.filter((_, idx) => idx !== i));

  /* opportunities */
  const [opps, setOpps] = useState<OPDraft[]>([]);
  const setOP = (i: number, k: keyof OPDraft, v: string) =>
    setOpps(list => list.map((o, idx) => idx === i ? { ...o, [k]: v } : o));
  const removeOP = (i: number) => setOpps(list => list.filter((_, idx) => idx !== i));

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
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

    const account: Account = {
      id: `acc-${Date.now()}`,
      name: basic.name.trim(),
      industry: basic.industry.trim(),
      segment: basic.segment as Account['segment'],
      owner: basic.owner.trim(),
      location: basic.location.trim() || '—',
      website: basic.website.trim() || undefined,
      description: basic.description.trim(),
      createdAt: Date.now(),
      stakeholders: stakeholders.filter(s => s.name.trim()).map((s, i) => ({
        id: `sk-${Date.now()}-${i}`,
        name: s.name.trim(), role: s.role.trim(), email: s.email.trim(),
        phone: s.phone.trim() || undefined, notes: s.notes.trim() || undefined,
        isPrimary: s.isPrimary,
      })),
      pastProjects: projects.filter(p => p.name.trim()).map((p, i) => ({
        id: `pr-${Date.now()}-${i}`,
        name: p.name.trim(),
        year: parseInt(p.year) || new Date().getFullYear(),
        status: p.status,
        revenue: Math.round(parseFloat(p.revenue || '0') * 100000),
        description: p.description.trim() || undefined,
      })),
      opportunities: opps.filter(o => o.name.trim()).map((o, i) => ({
        id: `op-${Date.now()}-${i}`,
        name: o.name.trim(), stage: o.stage,
        value: Math.round(parseFloat(o.value || '0') * 100000),
        probability: parseInt(o.probability) || 0,
        closeDate: o.closeDate || new Date().toISOString().slice(0, 10),
        description: o.description.trim() || undefined,
      })),
      tasks: [],
    };

    dispatch({ type: 'ADD_ACCOUNT', account });
    onDone();
  }

  /* ── shared styles ────────────────────────────────────────── */
  const inp = (err?: boolean): React.CSSProperties => ({
    width: '100%', padding: '8px 11px', fontSize: 13, borderRadius: 'var(--r-sm)',
    background: 'var(--bg)', border: `1px solid ${err ? 'var(--red)' : 'var(--border2)'}`,
    color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  });
  const sel  = (): React.CSSProperties => ({ ...inp(), cursor: 'pointer' });
  const area = (): React.CSSProperties => ({ ...inp(), resize: 'vertical', minHeight: 80, lineHeight: 1.6 });

  function Label({ t, req }: { t: string; req?: boolean }) {
    return <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{t}{req && <span style={{ color:'var(--red)', marginLeft:2 }}>*</span>}</div>;
  }

  function SectionHead({ title, count }: { title: string; count?: number }) {
    return (
      <div style={{ margin:'28px 0 16px', paddingBottom:8, borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{title}</span>
        {count !== undefined && <span style={{ fontSize:11, color:'var(--text3)' }}>({count})</span>}
      </div>
    );
  }

  function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button type="button" onClick={onClick} style={{ marginTop:8, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', background:'var(--accent-dim)', color:'var(--accent)', border:'1px dashed var(--accent-border)', borderRadius:'var(--r-sm)' }}>
        + {label}
      </button>
    );
  }

  function CardWrap({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
    return (
      <div style={{ position:'relative', padding:'14px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:10 }}>
        <button type="button" onClick={onRemove} style={{ position:'absolute', top:10, right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, color:'var(--text3)', lineHeight:1, padding:'0 4px' }}>×</button>
        {children}
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg)' }}>

      {/* Panel header */}
      <div style={{ padding:'18px 32px', background:'var(--bg2)', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:2 }}>New Account</div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'var(--text)', fontFamily:'DM Serif Display, serif' }}>Add Account Details</h2>
        </div>
        <button onClick={onCancel} style={{ background:'none', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', padding:'6px 14px', fontSize:12, color:'var(--text3)', cursor:'pointer' }}>
          Cancel
        </button>
      </div>

      {/* Scrollable form */}
      <form onSubmit={submit} style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
        <div style={{ maxWidth:780 }}>

          {/* ── 1. Basic Info ─────────────────────────────────── */}
          <SectionHead title="Basic Information" />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 24px' }}>
            <div>
              <Label t="Account Name" req />
              <input style={inp(!!errors.name)} value={basic.name} onChange={e => setB('name',e.target.value)} placeholder="e.g. Acme Corporation" autoFocus />
              {errors.name && <div style={{ fontSize:11, color:'var(--red)', marginTop:3 }}>{errors.name}</div>}
            </div>
            <div>
              <Label t="Industry" req />
              <input style={inp(!!errors.industry)} value={basic.industry} onChange={e => setB('industry',e.target.value)} placeholder="e.g. Financial Services" />
              {errors.industry && <div style={{ fontSize:11, color:'var(--red)', marginTop:3 }}>{errors.industry}</div>}
            </div>
            <div>
              <Label t="Segment" />
              <select style={sel()} value={basic.segment} onChange={e => setB('segment',e.target.value)}>
                <option>Enterprise</option><option>Mid-Market</option><option>SMB</option>
              </select>
            </div>
            <div>
              <Label t="Account Owner" req />
              <input style={inp(!!errors.owner)} value={basic.owner} onChange={e => setB('owner',e.target.value)} placeholder="e.g. Priya Nair" />
              {errors.owner && <div style={{ fontSize:11, color:'var(--red)', marginTop:3 }}>{errors.owner}</div>}
            </div>
            <div>
              <Label t="Location" />
              <input style={inp()} value={basic.location} onChange={e => setB('location',e.target.value)} placeholder="e.g. Mumbai, India" />
            </div>
            <div>
              <Label t="Website" />
              <input style={inp()} value={basic.website} onChange={e => setB('website',e.target.value)} placeholder="e.g. acme.com" />
            </div>
          </div>
          <div style={{ marginTop:14 }}>
            <Label t="Account Description" />
            <textarea style={area()} value={basic.description} onChange={e => setB('description',e.target.value)}
              placeholder="Key relationships, strategic context, decision-making structure…" />
          </div>

          {/* ── 2. Stakeholders ───────────────────────────────── */}
          <SectionHead title="Stakeholders" count={stakeholders.length} />
          {stakeholders.map((s, i) => (
            <CardWrap key={i} onRemove={() => removeSK(i)}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 20px' }}>
                <div><Label t="Name" /><input style={inp()} value={s.name} onChange={e => setSK(i,'name',e.target.value)} placeholder="Full name" /></div>
                <div><Label t="Role / Title" /><input style={inp()} value={s.role} onChange={e => setSK(i,'role',e.target.value)} placeholder="e.g. CTO" /></div>
                <div><Label t="Email" /><input style={inp()} type="email" value={s.email} onChange={e => setSK(i,'email',e.target.value)} placeholder="email@company.com" /></div>
                <div><Label t="Phone" /><input style={inp()} value={s.phone} onChange={e => setSK(i,'phone',e.target.value)} placeholder="+91 98765 43210" /></div>
                <div style={{ gridColumn:'1/-1' }}><Label t="Notes" /><textarea style={area()} value={s.notes} onChange={e => setSK(i,'notes',e.target.value)} placeholder="Relationship notes, preferences…" /></div>
                <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" id={`sk-primary-${i}`} checked={s.isPrimary} onChange={e => setSK(i,'isPrimary',e.target.checked)} style={{ accentColor:'var(--accent)', width:14, height:14 }} />
                  <label htmlFor={`sk-primary-${i}`} style={{ fontSize:12, color:'var(--text2)', cursor:'pointer' }}>Primary contact</label>
                </div>
              </div>
            </CardWrap>
          ))}
          <AddBtn label="Add Stakeholder" onClick={() => setStakeholders(l => [...l, blankSK()])} />

          {/* ── 3. Past Projects ──────────────────────────────── */}
          <SectionHead title="Past Projects" count={projects.length} />
          {projects.map((p, i) => (
            <CardWrap key={i} onRemove={() => removePR(i)}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px 20px' }}>
                <div style={{ gridColumn:'1/-1' }}><Label t="Project Name" /><input style={inp()} value={p.name} onChange={e => setPR(i,'name',e.target.value)} placeholder="e.g. Core Banking Migration" /></div>
                <div>
                  <Label t="Year" />
                  <input style={inp()} type="number" min="2000" max="2100" value={p.year} onChange={e => setPR(i,'year',e.target.value)} />
                </div>
                <div>
                  <Label t="Status" />
                  <select style={sel()} value={p.status} onChange={e => setPR(i,'status',e.target.value as PRDraft['status'])}>
                    <option>Completed</option><option>Ongoing</option><option>Cancelled</option>
                  </select>
                </div>
                <div>
                  <Label t="Revenue (₹ Lakhs)" />
                  <input style={inp()} type="number" min="0" step="0.1" value={p.revenue} onChange={e => setPR(i,'revenue',e.target.value)} placeholder="e.g. 48" />
                </div>
                <div style={{ gridColumn:'1/-1' }}><Label t="Description" /><textarea style={area()} value={p.description} onChange={e => setPR(i,'description',e.target.value)} placeholder="Brief description of the project" /></div>
              </div>
            </CardWrap>
          ))}
          <AddBtn label="Add Project" onClick={() => setProjects(l => [...l, blankPR()])} />

          {/* ── 4. Opportunities ──────────────────────────────── */}
          <SectionHead title="Opportunities" count={opps.length} />
          {opps.map((o, i) => (
            <CardWrap key={i} onRemove={() => removeOP(i)}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px 20px' }}>
                <div style={{ gridColumn:'1/-1' }}><Label t="Opportunity Name" /><input style={inp()} value={o.name} onChange={e => setOP(i,'name',e.target.value)} placeholder="e.g. Cloud Infra Upgrade" /></div>
                <div>
                  <Label t="Stage" />
                  <select style={sel()} value={o.stage} onChange={e => setOP(i,'stage',e.target.value as OppStage)}>
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label t="Value (₹ Lakhs)" />
                  <input style={inp()} type="number" min="0" step="0.1" value={o.value} onChange={e => setOP(i,'value',e.target.value)} placeholder="e.g. 120" />
                </div>
                <div>
                  <Label t="Probability (%)" />
                  <input style={inp()} type="number" min="0" max="100" value={o.probability} onChange={e => setOP(i,'probability',e.target.value)} />
                </div>
                <div>
                  <Label t="Close Date" />
                  <input style={inp()} type="date" value={o.closeDate} onChange={e => setOP(i,'closeDate',e.target.value)} />
                </div>
                <div style={{ gridColumn:'1/-1' }}><Label t="Description" /><textarea style={area()} value={o.description} onChange={e => setOP(i,'description',e.target.value)} placeholder="Key context, risks, next steps…" /></div>
              </div>
            </CardWrap>
          ))}
          <AddBtn label="Add Opportunity" onClick={() => setOpps(l => [...l, blankOP()])} />

          {/* ── Submit ────────────────────────────────────────── */}
          <div style={{ display:'flex', gap:10, marginTop:36, paddingTop:20, borderTop:'1px solid var(--border)' }}>
            <button type="submit" style={{ padding:'10px 28px', fontSize:13, fontWeight:700, cursor:'pointer', background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--r-sm)' }}>
              Create Account
            </button>
            <button type="button" onClick={onCancel} style={{ padding:'10px 20px', fontSize:13, fontWeight:500, cursor:'pointer', background:'transparent', color:'var(--text3)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)' }}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
