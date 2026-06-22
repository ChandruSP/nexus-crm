'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchDepartments, apiCreateDepartment, apiUpdateDepartment, apiDeleteDepartment, Department } from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';

const ICONS_LIST = ['🎯','📊','💼','🏗️','👥','📦','🔧','💡','🌐','📈','🤝','⚡','🏦','🛒','🏥','✈️','🎨','🔬','📱','🏆'];
const COLORS_LIST = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#3b82f6','#a855f7','#84cc16'];
function randomIcon() { return ICONS_LIST[Math.floor(Math.random() * ICONS_LIST.length)]; }
function randomColor() { return COLORS_LIST[Math.floor(Math.random() * COLORS_LIST.length)]; }

// ── Icon drawing ──────────────────────────────────────────────────────────────

type DrawFn = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) => void;

function stroke(ctx: CanvasRenderingContext2D, fn: () => void) {
  ctx.beginPath(); fn(); ctx.stroke();
}
function fill(ctx: CanvasRenderingContext2D, fn: () => void) {
  ctx.beginPath(); fn(); ctx.fill();
}

const ICON_MAP: Record<string, DrawFn> = {
  'sales': (ctx, cx, cy, s) => {  // trending up
    stroke(ctx, () => {
      ctx.moveTo(cx-s*8, cy+s*5); ctx.lineTo(cx-s*2, cy-s*1);
      ctx.lineTo(cx+s*2, cy+s*3); ctx.lineTo(cx+s*8, cy-s*5);
    });
    stroke(ctx, () => { ctx.moveTo(cx+s*4, cy-s*5); ctx.lineTo(cx+s*8, cy-s*5); ctx.lineTo(cx+s*8, cy-s*1); });
  },
  'marketing': (ctx, cx, cy, s) => {  // megaphone
    fill(ctx, () => {
      ctx.moveTo(cx-s*2, cy-s*3); ctx.lineTo(cx+s*8, cy-s*7);
      ctx.lineTo(cx+s*8, cy+s*7); ctx.lineTo(cx-s*2, cy+s*3); ctx.closePath();
    });
    stroke(ctx, () => { ctx.rect(cx-s*6, cy-s*3, s*4, s*6); });
    stroke(ctx, () => { ctx.moveTo(cx-s*3, cy+s*3); ctx.lineTo(cx-s*5, cy+s*7); ctx.lineTo(cx-s*1, cy+s*7); ctx.lineTo(cx+s*1, cy+s*3); });
  },
  'hr': (ctx, cx, cy, s) => {  // users
    stroke(ctx, () => { ctx.arc(cx+s*2, cy-s*3.5, s*3, 0, Math.PI*2); });
    stroke(ctx, () => { ctx.moveTo(cx-s*5, cy+s*8); ctx.quadraticCurveTo(cx-s*4, cy+s*1, cx+s*2, cy+s*1); ctx.quadraticCurveTo(cx+s*8, cy+s*1, cx+s*8, cy+s*8); });
    ctx.globalAlpha *= 0.55;
    stroke(ctx, () => { ctx.arc(cx-s*4, cy-s*4, s*2.2, 0, Math.PI*2); });
    stroke(ctx, () => { ctx.moveTo(cx-s*10, cy+s*8); ctx.quadraticCurveTo(cx-s*9, cy+s*2, cx-s*4, cy+s*2); });
    ctx.globalAlpha = ctx.globalAlpha / 0.55;
  },
  'finance': (ctx, cx, cy, s) => {  // bar chart
    fill(ctx, () => { ctx.roundRect(cx-s*8, cy+s*1, s*4, s*5, s*0.5); });
    fill(ctx, () => { ctx.roundRect(cx-s*2, cy-s*5, s*4, s*11, s*0.5); });
    fill(ctx, () => { ctx.roundRect(cx+s*4, cy-s*2, s*4, s*8, s*0.5); });
  },
  'operations': (ctx, cx, cy, s) => {  // gear
    stroke(ctx, () => { ctx.arc(cx, cy, s*4.5, 0, Math.PI*2); });
    stroke(ctx, () => { ctx.arc(cx, cy, s*2, 0, Math.PI*2); });
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*Math.PI*2;
      stroke(ctx, () => {
        ctx.moveTo(cx+Math.cos(a)*s*4.5, cy+Math.sin(a)*s*4.5);
        ctx.lineTo(cx+Math.cos(a)*s*6.5, cy+Math.sin(a)*s*6.5);
      });
    }
  },
  'success': (ctx, cx, cy, s) => {  // star
    const pts = Array.from({length:5}, (_, i) => {
      const a = (i/5)*Math.PI*2 - Math.PI/2;
      const b = a + Math.PI/5;
      return [cx+Math.cos(a)*s*7, cy+Math.sin(a)*s*7, cx+Math.cos(b)*s*3, cy+Math.sin(b)*s*3];
    });
    fill(ctx, () => {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const [ox, oy, ix, iy] of pts) { ctx.lineTo(ox,oy); ctx.lineTo(ix,iy); }
      ctx.closePath();
    });
  },
  'product': (ctx, cx, cy, s) => {  // rocket
    fill(ctx, () => {
      ctx.moveTo(cx, cy-s*8); ctx.quadraticCurveTo(cx+s*5, cy-s*2, cx+s*4, cy+s*4);
      ctx.lineTo(cx-s*4, cy+s*4); ctx.quadraticCurveTo(cx-s*5, cy-s*2, cx, cy-s*8);
    });
    fill(ctx, () => { ctx.arc(cx, cy, s*2, 0, Math.PI*2); });
    ctx.globalAlpha *= 0.5;
    fill(ctx, () => { ctx.moveTo(cx-s*4, cy+s*4); ctx.lineTo(cx-s*7, cy+s*8); ctx.lineTo(cx-s*1, cy+s*6); });
    fill(ctx, () => { ctx.moveTo(cx+s*4, cy+s*4); ctx.lineTo(cx+s*7, cy+s*8); ctx.lineTo(cx+s*1, cy+s*6); });
    ctx.globalAlpha = ctx.globalAlpha / 0.5;
  },
  'engineering': (ctx, cx, cy, s) => {  // code brackets
    stroke(ctx, () => { ctx.moveTo(cx-s*2, cy-s*7); ctx.lineTo(cx-s*8, cy); ctx.lineTo(cx-s*2, cy+s*7); });
    stroke(ctx, () => { ctx.moveTo(cx+s*2, cy-s*7); ctx.lineTo(cx+s*8, cy); ctx.lineTo(cx+s*2, cy+s*7); });
    ctx.globalAlpha *= 0.5;
    stroke(ctx, () => { ctx.moveTo(cx-s*3, cy); ctx.lineTo(cx+s*3, cy); });
    ctx.globalAlpha = ctx.globalAlpha / 0.5;
  },
  'legal': (ctx, cx, cy, s) => {  // shield
    fill(ctx, () => {
      ctx.moveTo(cx, cy-s*8); ctx.lineTo(cx+s*7, cy-s*5); ctx.lineTo(cx+s*7, cy+s*1);
      ctx.quadraticCurveTo(cx+s*7, cy+s*7, cx, cy+s*9);
      ctx.quadraticCurveTo(cx-s*7, cy+s*7, cx-s*7, cy+s*1);
      ctx.lineTo(cx-s*7, cy-s*5); ctx.closePath();
    });
  },
  'strategy': (ctx, cx, cy, s) => {  // target
    stroke(ctx, () => { ctx.arc(cx, cy, s*7, 0, Math.PI*2); });
    stroke(ctx, () => { ctx.arc(cx, cy, s*4, 0, Math.PI*2); });
    fill(ctx, () => { ctx.arc(cx, cy, s*1.5, 0, Math.PI*2); });
  },
  'default': (ctx, cx, cy, s) => {  // building
    fill(ctx, () => { ctx.rect(cx-s*7, cy-s*8, s*14, s*14); });
    ctx.globalAlpha *= 0.4;
    fill(ctx, () => { ctx.rect(cx-s*5, cy-s*5, s*3, s*3); });
    fill(ctx, () => { ctx.rect(cx+s*2, cy-s*5, s*3, s*3); });
    fill(ctx, () => { ctx.rect(cx-s*5, cy-s*0.5, s*3, s*3); });
    fill(ctx, () => { ctx.rect(cx+s*2, cy-s*0.5, s*3, s*3); });
    ctx.globalAlpha = ctx.globalAlpha / 0.4;
    fill(ctx, () => { ctx.rect(cx-s*3, cy+s*3, s*6, s*3); });
  },
};

function getIconKey(deptName: string): string {
  const n = deptName.toLowerCase();
  if (n.includes('sales') || n.includes('kam') || n.includes('revenue')) return 'sales';
  if (n.includes('market')) return 'marketing';
  if (n.includes('hr') || n.includes('human') || n.includes('people') || n.includes('talent')) return 'hr';
  if (n.includes('finance') || n.includes('account') || n.includes('budget')) return 'finance';
  if (n.includes('operat') || n.includes('infra') || n.includes('supply')) return 'operations';
  if (n.includes('success') || n.includes('support') || n.includes('customer')) return 'success';
  if (n.includes('product') || n.includes('design')) return 'product';
  if (n.includes('engineer') || n.includes('tech') || n.includes('dev')) return 'engineering';
  if (n.includes('legal') || n.includes('compli') || n.includes('law')) return 'legal';
  if (n.includes('strategy') || n.includes('growth') || n.includes('innov')) return 'strategy';
  return 'default';
}

function drawIcon(ctx: CanvasRenderingContext2D, _deptName: string, cx: number, cy: number, iconSize: number) {
  // Universal icon: simple grid of 4 squares (department/grid symbol)
  const s = iconSize / 18;
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(1.2, s * 1.9);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const h = s * 5.5; // half-gap between squares
  const sq = s * 4.5; // square size
  const gap = s * 1.4;
  // top-left, top-right, bottom-left, bottom-right squares
  for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = cx + ox * (sq / 2 + gap / 2);
    const y = cy + oy * (sq / 2 + gap / 2);
    ctx.beginPath();
    ctx.roundRect(x - sq / 2, y - sq / 2, sq, sq, s * 1.1);
    ctx.stroke();
  }
  void h;
}

// ── Glass bubble renderer ─────────────────────────────────────────────────────

function drawGlassBubble(
  ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, hot: boolean, teal = false
) {
  const c0 = teal ? `rgba(100,230,220,${(alpha * 1.0).toFixed(2)})` : `rgba(155,140,255,${(alpha * 1.0).toFixed(2)})`;
  const c1 = teal ? `rgba(20,184,166,${(alpha * 0.92).toFixed(2)})` : `rgba(99,102,241,${(alpha * 0.92).toFixed(2)})`;
  const c2 = teal ? `rgba(13,120,110,${(alpha * 0.88).toFixed(2)})` : `rgba(52,40,180,${(alpha * 0.88).toFixed(2)})`;
  const glow = teal ? '20,184,166' : '99,102,241';
  const shadow = teal ? '10,60,55' : '20,10,80';

  const g1 = ctx.createRadialGradient(x - r*0.32, y - r*0.36, r*0.04, x + r*0.1, y + r*0.1, r*1.05);
  g1.addColorStop(0, c0); g1.addColorStop(0.4, c1); g1.addColorStop(1, c2);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = g1; ctx.fill();

  const g2 = ctx.createRadialGradient(x - r*0.4, y - r*0.45, r*0.01, x - r*0.15, y - r*0.15, r*0.7);
  g2.addColorStop(0, 'rgba(255,255,255,0.26)');
  g2.addColorStop(0.6, 'rgba(255,255,255,0.04)');
  g2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = g2; ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r - 1, Math.PI*1.1, Math.PI*1.9);
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1.5; ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r - 1, Math.PI*0.1, Math.PI*0.9);
  ctx.strokeStyle = `rgba(${shadow},0.22)`;
  ctx.lineWidth = 2; ctx.stroke();

  if (hot) {
    for (const [off, a] of [[14, 0.22], [24, 0.12], [36, 0.05]] as [number, number][]) {
      ctx.beginPath(); ctx.arc(x, y, r + off, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(${glow},${a})`;
      ctx.lineWidth = 1.5; ctx.stroke();
    }
  }
}

// ── Bubble physics ────────────────────────────────────────────────────────────

interface Bubble {
  x: number; y: number; vx: number; vy: number;
  r: number; alpha: number;
  scale: number; scaleV: number; targetScale: number;
  dept: Department | null;
  hovered: boolean;
}

interface Pulse { i: number; j: number; t: number; speed: number; }

function placeNoOverlap(r: number, existing: Bubble[], w: number, h: number, pad = 10): { x: number; y: number } {
  const margin = r + pad;
  for (let attempt = 0; attempt < 200; attempt++) {
    const x = margin + Math.random() * (w - margin*2);
    const y = margin + Math.random() * (h - margin*2);
    if (existing.every(b => Math.hypot(b.x - x, b.y - y) >= b.r + r + pad)) return { x, y };
  }
  // Fallback: just place randomly without overlap guarantee
  return { x: margin + Math.random()*(w - margin*2), y: margin + Math.random()*(h - margin*2) };
}

function makeBubbles(depts: Department[], w: number, h: number): Bubble[] {
  const out: Bubble[] = [];
  depts.forEach(d => {
    const r = 46 + Math.random()*18;
    const { x, y } = placeNoOverlap(r, out, w, h, 12);
    const angle = Math.random() * Math.PI * 2;
    const spd = 0.7 + Math.random() * 0.6;
    out.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, r, alpha:0.88, scale:1, scaleV:0, targetScale:1, dept:d, hovered:false });
  });
  [32,26,22,18,14,11,9,8,28,20,16,13,10,8,24,15,12,10,30,18].forEach(r => {
    const { x, y } = placeNoOverlap(r, out, w, h, 6);
    out.push({ x, y, vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28, r, alpha:r>24?0.055:r>16?0.09:r>10?0.13:0.17, scale:1, scaleV:0, targetScale:1, dept:null, hovered:false });
  });
  return out;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Icon</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(10, 1fr)', gap:6 }}>
        {ICONS_LIST.map(icon => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            style={{
              width:36, height:36, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius:8, border: value === icon ? '2px solid var(--accent)' : '1.5px solid var(--border2)',
              background: value === icon ? 'var(--accent-dim)' : 'var(--bg3)',
              cursor:'pointer', transition:'border-color 0.12s, background 0.12s',
              boxShadow: value === icon ? '0 0 0 2px rgba(99,102,241,0.2)' : 'none',
            }}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ dept, onClose, onConfirm }: { dept: Department; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  async function handleDelete() {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  }
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:600, backdropFilter:'blur(6px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:601, background:'var(--bg2)', borderRadius:20, border:'1px solid rgba(239,68,68,0.35)', padding:'32px', width:400, maxWidth:'92vw', boxShadow:'0 32px 80px rgba(0,0,0,0.35)' }}>
        {/* Icon */}
        <div style={{ width:52, height:52, borderRadius:14, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Delete {dept.icon} {dept.name}?</div>
        <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.6, marginBottom:28 }}>
          This will permanently delete the department and <strong style={{ color:'var(--text2)' }}>all associated accounts, tasks, contacts, and opportunities</strong>. This cannot be undone.
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleDelete} disabled={loading} style={{ flex:1, padding:'11px', background:'rgb(239,68,68)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', opacity:loading?0.7:1, transition:'opacity 0.15s' }}>
            {loading ? 'Deleting…' : 'Yes, delete permanently'}
          </button>
          <button onClick={onClose} disabled={loading} style={{ padding:'11px 18px', background:'transparent', color:'var(--text3)', border:'1px solid var(--border2)', borderRadius:10, fontSize:13, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </>
  );
}

function EditDeptModal({ dept, onClose, onSave }: { dept: Department; onClose: () => void; onSave: (d: Department) => void }) {
  const [name, setName] = useState(dept.name);
  const [icon, setIcon] = useState(dept.icon || ICONS_LIST[0]);
  const [hasAccounts, setHasAccounts] = useState(dept.hasAccounts);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr('Name is required'); return; }
    setLoading(true);
    try {
      await apiUpdateDepartment(dept.id, { name: name.trim(), icon, hasAccounts });
      onSave({ ...dept, name: name.trim(), icon, hasAccounts });
      onClose();
    } catch { setErr('Failed to save'); } finally { setLoading(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:600, backdropFilter:'blur(6px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:601, background:'var(--bg2)', borderRadius:20, border:'1px solid var(--border2)', padding:'32px', width:460, maxWidth:'94vw', boxShadow:'0 32px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Edit Department</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20 }}>{icon} {dept.name}</div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <input style={{ width:'100%', padding:'11px 14px', fontSize:14, borderRadius:10, background:'var(--bg3)', border:`1.5px solid ${err?'var(--red)':'var(--border2)'}`, color:'var(--text)', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              value={name} onChange={e => { setName(e.target.value); setErr(''); }} placeholder="Department name" autoFocus />
            {err && <div style={{ fontSize:12, color:'var(--red)', marginTop:5 }}>{err}</div>}
          </div>
          <IconPicker value={icon} onChange={setIcon} />
          <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', padding:'12px 14px', background:'var(--bg3)', borderRadius:10, border:`1.5px solid ${hasAccounts?'var(--accent)':'var(--border)'}` }}>
            <input type="checkbox" checked={hasAccounts} onChange={e => setHasAccounts(e.target.checked)} style={{ accentColor:'var(--accent)', width:15, height:15, cursor:'pointer', marginTop:2, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>Include Accounts (KAM mode)</div>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>Adds full CRM: accounts, contacts, opportunities & pipeline</div>
            </div>
          </label>
          <div style={{ display:'flex', gap:8, marginTop:2 }}>
            <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', opacity:loading?.7:1 }}>{loading ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" onClick={onClose} style={{ padding:'11px 18px', background:'transparent', color:'var(--text3)', border:'1px solid var(--border2)', borderRadius:10, fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

function NewDeptModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: Department) => void }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(randomIcon);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setErr('Name is required'); return; }
    setLoading(true);
    try {
      const dept = await apiCreateDepartment({ name: name.trim(), color: randomColor(), icon, hasAccounts });
      onCreate(dept); onClose();
    } finally { setLoading(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:600, backdropFilter:'blur(6px)' }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:601, background:'var(--bg2)', borderRadius:20, border:'1px solid var(--border2)', padding:'32px', width:460, maxWidth:'94vw', boxShadow:'0 32px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize:17, fontWeight:700, color:'var(--text)', marginBottom:4 }}>New Department</div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20 }}>Choose an icon and name for your department</div>
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <input style={{ width:'100%', padding:'11px 14px', fontSize:14, borderRadius:10, background:'var(--bg3)', border:`1.5px solid ${err?'var(--red)':'var(--border2)'}`, color:'var(--text)', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              value={name} onChange={e => { setName(e.target.value); setErr(''); }} placeholder="e.g. HR, Finance, Operations" autoFocus />
            {err && <div style={{ fontSize:12, color:'var(--red)', marginTop:5 }}>{err}</div>}
          </div>
          <IconPicker value={icon} onChange={setIcon} />
          <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', padding:'12px 14px', background:'var(--bg3)', borderRadius:10, border:`1.5px solid ${hasAccounts?'var(--accent)':'var(--border)'}` }}>
            <input type="checkbox" checked={hasAccounts} onChange={e => setHasAccounts(e.target.checked)} style={{ accentColor:'var(--accent)', width:15, height:15, cursor:'pointer', marginTop:2, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>Include Accounts (KAM mode)</div>
              <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>Adds full CRM: accounts, contacts, opportunities & pipeline</div>
            </div>
          </label>
          <div style={{ display:'flex', gap:8, marginTop:2 }}>
            <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', opacity:loading?.7:1 }}>{loading ? 'Creating…' : 'Create Department'}</button>
            <button type="button" onClick={onClose} style={{ padding:'11px 18px', background:'transparent', color:'var(--text3)', border:'1px solid var(--border2)', borderRadius:10, fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onSelect: (dept: Department) => void;
  pendingSlug?: string | null;
  onSlugResolved?: () => void;
}

function deptSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function TopbarUser() {
  const [name, setName] = useState('');
  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(d => setName(d.user?.name || d.user?.email || '')).catch(() => {});
  }, []);
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  async function handleSignOut() {
    await fetch('/api/session', { method: 'DELETE' });
    window.location.href = '/login';
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      {name && (
        <div style={{ width:28, height:28, borderRadius:'50%', background:'#6366f1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
          {initials}
        </div>
      )}
      {name && (
        <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {name}
        </span>
      )}
      <button
        onClick={handleSignOut}
        style={{ padding:'3px 10px', fontSize:11, fontWeight:600, color:'var(--text3)', background:'transparent', border:'1px solid var(--border2)', borderRadius:6, cursor:'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='var(--text3)'; }}
        onMouseLeave={e => { e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.borderColor='var(--border2)'; }}
      >
        Sign out
      </button>
    </div>
  );
}

export function DepartmentSelector({ onSelect, pendingSlug, onSlugResolved }: Props) {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [speedLabel, setSpeedLabel] = useState('1.0×');
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<number>(1);
  const stateRef = useRef<{ bubbles: Bubble[]; pulses: Pulse[]; raf: number; w: number; h: number; }>({
    bubbles:[], pulses:[], raf:0, w:0, h:0,
  });

  useEffect(() => {
    fetchDepartments().then(d => { setDepartments(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  // Auto-select department from URL slug on first load
  useEffect(() => {
    if (!pendingSlug || loading || departments.length === 0) return;
    const match = departments.find(d => deptSlug(d.name) === pendingSlug);
    if (match) onSelect(match);
    onSlugResolved?.();
  }, [pendingSlug, loading, departments, onSelect, onSlugResolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || departments.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const state = stateRef.current;
    let ctxRef: CanvasRenderingContext2D | null = null;

    function resize() {
      if (!canvas || !container) return;
      const { width: w, height: h } = container.getBoundingClientRect();
      state.w = w; state.h = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      ctxRef = ctx;
      if (state.bubbles.length === 0) state.bubbles = makeBubbles(departments, w, h);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Spawn pulses occasionally
    const pulseInterval = setInterval(() => {
      const { bubbles } = state;
      const deptBubs = bubbles.filter(b => b.dept);
      if (deptBubs.length < 2) return;
      const i = bubbles.indexOf(deptBubs[Math.floor(Math.random()*deptBubs.length)]);
      const j = bubbles.indexOf(deptBubs[Math.floor(Math.random()*deptBubs.length)]);
      if (i !== j) state.pulses.push({ i, j, t: 0, speed: 0.008 + Math.random()*0.006 });
    }, 1800);

    function draw() {
      const ctx = ctxRef;
      if (!ctx) { state.raf = requestAnimationFrame(draw); return; }
      const { bubbles, pulses, w, h } = state;

      ctx.clearRect(0, 0, w, h);

      // Physics — move + drag + wall bounce
      const clamp = (b: Bubble) => {
        b.x = Math.max(b.r, Math.min(w - b.r, b.x));
        b.y = Math.max(b.r, Math.min(h - b.r, b.y));
      };
      const sm = speedRef.current;
      for (const b of bubbles) {
        if (b.hovered) continue; // frozen while editing
        b.x += b.vx * sm; b.y += b.vy * sm;
        // Gentle drag so post-collision speed decays back to drift
        b.vx *= 0.994; b.vy *= 0.994;
        // Maintain minimum drift so bubbles never stop (scaled by speed)
        const spd = Math.hypot(b.vx, b.vy);
        const minSpd = b.dept ? 0.55 / Math.max(sm, 0.3) : 0.10 / Math.max(sm, 0.3);
        if (spd > 0 && spd < minSpd) { b.vx = b.vx/spd*minSpd; b.vy = b.vy/spd*minSpd; }
        // Wall bounce
        if (b.x - b.r < 0)  { b.vx =  Math.abs(b.vx); }
        if (b.x + b.r > w)  { b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < 0)  { b.vy =  Math.abs(b.vy); }
        if (b.y + b.r > h)  { b.vy = -Math.abs(b.vy); }
        clamp(b);
        // Scale spring
        const sp = (b.targetScale - b.scale) * 0.24;
        b.scaleV = (b.scaleV + sp) * 0.73;
        b.scale += b.scaleV;
      }

      // Circle-circle collision — jingly elastic bounce
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const bi = bubbles[i], bj = bubbles[j];
          if (bi.hovered || bj.hovered) continue; // don't jostle frozen bubbles
          const dx = bj.x - bi.x, dy = bj.y - bi.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const minD = bi.r + bj.r;
          if (dist >= minD) continue;
          const nx = dx / dist, ny = dy / dist;
          // Mass-proportional separation so neither escapes screen
          const mi = bi.r * bi.r, mj = bj.r * bj.r, mt = mi + mj;
          const overlap = minD - dist;
          bi.x -= nx * overlap * (mj/mt); bi.y -= ny * overlap * (mj/mt);
          bj.x += nx * overlap * (mi/mt); bj.y += ny * overlap * (mi/mt);
          clamp(bi); clamp(bj);
          // Velocity impulse
          const dvn = (bi.vx - bj.vx)*nx + (bi.vy - bj.vy)*ny;
          if (dvn <= 0) continue;
          const restitution = 0.88; // high = jingly!
          const imp = (1 + restitution) * dvn / (1/mi + 1/mj);
          bi.vx -= (imp/mi)*nx; bi.vy -= (imp/mi)*ny;
          bj.vx += (imp/mj)*nx; bj.vy += (imp/mj)*ny;
          // Jingle: brief scale kick on both bubbles
          bi.scaleV += 0.06; bj.scaleV += 0.06;
          // Cap post-collision speed (drag will bleed it off naturally)
          for (const b of [bi, bj]) {
            const s = Math.hypot(b.vx, b.vy);
            if (s > 2.2) { b.vx = b.vx/s*2.2; b.vy = b.vy/s*2.2; }
          }
        }
      }

      // Connection lines
      const LINE_D = 220;
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i+1; j < bubbles.length; j++) {
          const d = Math.hypot(bubbles[j].x - bubbles[i].x, bubbles[j].y - bubbles[i].y);
          if (d >= LINE_D) continue;
          const t = 1 - d/LINE_D;
          const hot = bubbles[i].targetScale > 1 || bubbles[j].targetScale > 1;
          ctx.beginPath();
          ctx.moveTo(bubbles[i].x, bubbles[i].y);
          ctx.lineTo(bubbles[j].x, bubbles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${hot ? t*0.45 : t*0.1})`;
          ctx.lineWidth = hot ? 1.2 : 0.5;
          ctx.stroke();
        }
      }

      // Pulse dots traveling along lines
      for (let p = pulses.length-1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.t += pulse.speed;
        if (pulse.t > 1) { pulses.splice(p, 1); continue; }
        const a = bubbles[pulse.i], b = bubbles[pulse.j];
        if (!a || !b) { pulses.splice(p, 1); continue; }
        const px = a.x + (b.x - a.x) * pulse.t;
        const py = a.y + (b.y - a.y) * pulse.t;
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2);
        ctx.fillStyle = `rgba(160,150,255,${0.9 * Math.sin(pulse.t * Math.PI)})`;
        ctx.fill();
      }

      // Draw bubbles (decorative first, then dept on top)
      for (const b of bubbles) {
        if (b.dept) continue;
        const cr = b.r * b.scale;
        const g = ctx.createRadialGradient(b.x - cr*0.3, b.y - cr*0.35, cr*0.02, b.x, b.y, cr);
        g.addColorStop(0, `rgba(148,130,255,${b.alpha})`);
        g.addColorStop(1, `rgba(52,40,180,${b.alpha*0.7})`);
        ctx.beginPath(); ctx.arc(b.x, b.y, cr, 0, Math.PI*2);
        ctx.fillStyle = g; ctx.fill();
      }

      for (const b of bubbles) {
        if (!b.dept) continue;
        const cr = b.r * b.scale;
        const isKam = b.dept.name.toLowerCase().includes('kam');
        const nameColor = isKam ? 'rgba(20,184,166,1)' : 'rgba(99,102,241,1)';
        const nameFade  = isKam ? 'rgba(20,184,166,0.65)' : 'rgba(99,102,241,0.65)';

        drawGlassBubble(ctx, b.x, b.y, cr, b.alpha, b.hovered, isKam);

        if (b.hovered && isKam) {
          // ── KAM hover: show edit + delete ─────────────────────────────────
          const btnR = cr * 0.26;
          const gap  = cr * 0.38;

          // Edit button (left)
          const ex = b.x - gap, ey = b.y;
          ctx.beginPath(); ctx.arc(ex, ey, btnR, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.save();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.2, btnR*0.18);
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const ps = btnR * 0.52;
          ctx.beginPath();
          ctx.moveTo(ex - ps*0.6, ey + ps*0.6); ctx.lineTo(ex + ps*0.5, ey - ps*0.5);
          ctx.moveTo(ex + ps*0.15, ey - ps*0.85); ctx.lineTo(ex + ps*0.85, ey - ps*0.15);
          ctx.moveTo(ex - ps*0.6, ey + ps*0.6); ctx.lineTo(ex - ps*0.85, ey + ps*0.85);
          ctx.stroke(); ctx.restore();
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.font = `500 ${Math.max(9, btnR*0.55)}px -apple-system,sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillText('Edit', ex, ey + btnR + 4);

          // Delete button (right)
          const dx2 = b.x + gap, dy2 = b.y;
          ctx.beginPath(); ctx.arc(dx2, dy2, btnR, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(239,68,68,0.22)'; ctx.fill();
          ctx.strokeStyle = 'rgba(239,100,100,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
          ctx.save();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.2, btnR*0.18);
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          const ts = btnR * 0.52;
          ctx.beginPath();
          ctx.moveTo(dx2 - ts, dy2 - ts*0.4); ctx.lineTo(dx2 + ts, dy2 - ts*0.4);
          ctx.moveTo(dx2 - ts*0.5, dy2 - ts*0.4); ctx.lineTo(dx2 - ts*0.5, dy2 - ts*1.1);
          ctx.moveTo(dx2 + ts*0.5, dy2 - ts*0.4); ctx.lineTo(dx2 + ts*0.5, dy2 - ts*1.1);
          ctx.moveTo(dx2 - ts*0.7, dy2 - ts*1.1); ctx.lineTo(dx2 + ts*0.7, dy2 - ts*1.1);
          ctx.moveTo(dx2 - ts*0.6, dy2 - ts*0.4);
          ctx.lineTo(dx2 - ts*0.45, dy2 + ts*0.7);
          ctx.lineTo(dx2 + ts*0.45, dy2 + ts*0.7);
          ctx.lineTo(dx2 + ts*0.6, dy2 - ts*0.4);
          ctx.stroke(); ctx.restore();
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.font = `500 ${Math.max(9, btnR*0.55)}px -apple-system,sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillText('Delete', dx2, dy2 + btnR + 4);

          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.font = `700 13px -apple-system,sans-serif`;
          ctx.fillStyle = nameColor;
          ctx.fillText(b.dept.name, b.x, b.y + cr + 10);

        } else if (b.hovered) {
          // ── Non-KAM hover: just show name, no settings ────────────────────
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.font = `700 13px -apple-system,sans-serif`;
          ctx.fillStyle = nameColor;
          ctx.fillText(b.dept.name, b.x, b.y + cr + 10);

        } else {
          // ── Normal state: icon + name ──────────────────────────────────────
          const iconSize = cr * 0.72;
          ctx.save();
          drawIcon(ctx, b.dept.name, b.x, b.y - iconSize*0.08, iconSize);
          ctx.restore();

          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.font = `600 11.5px -apple-system,sans-serif`;
          ctx.fillStyle = nameFade;
          ctx.fillText(b.dept.name, b.x, b.y + cr + 10);
        }
      }

      state.raf = requestAnimationFrame(draw);
    }

    state.raf = requestAnimationFrame(draw);

    function getBtnCenters(b: Bubble) {
      const cr = b.r * b.scale;
      const gap = cr * 0.38;
      return { edit: { x: b.x - gap, y: b.y }, del: { x: b.x + gap, y: b.y }, btnR: cr * 0.26 };
    }

    function hit(mx: number, my: number) {
      // Check edit/delete buttons on hovered KAM bubbles only
      for (const b of state.bubbles) {
        if (!b.dept || !b.hovered) continue;
        if (!b.dept.name.toLowerCase().includes('kam')) continue;
        const { edit, del, btnR } = getBtnCenters(b);
        if (Math.hypot(mx - edit.x, my - edit.y) < btnR) return { type:'edit' as const, b };
        if (Math.hypot(mx - del.x,  my - del.y)  < btnR) return { type:'delete' as const, b };
      }
      for (const b of state.bubbles) {
        if (!b.dept) continue;
        if (Math.hypot(mx - b.x, my - b.y) < b.r * b.scale) return { type:'select' as const, b };
      }
      return null;
    }

    function onMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let ptr = false;
      for (const b of state.bubbles) {
        if (!b.dept) continue;
        const isOver = Math.hypot(mx - b.x, my - b.y) < b.r * b.scale;
        if (isOver && !b.hovered) {
          // entering: freeze and enlarge
          b.hovered = true;
          b.targetScale = 1.38;
        } else if (!isOver && b.hovered) {
          // leaving: unfreeze with small random velocity
          b.hovered = false;
          b.targetScale = 1;
          const angle = Math.random() * Math.PI * 2;
          const spd = 0.5 + Math.random() * 0.4;
          b.vx = Math.cos(angle) * spd;
          b.vy = Math.sin(angle) * spd;
        }
        if (isOver) ptr = true;
      }
      const h = hit(mx, my);
      canvas.style.cursor = h ? 'pointer' : ptr ? 'pointer' : 'default';
    }

    async function onClick(e: MouseEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const h = hit(e.clientX - r.left, e.clientY - r.top);
      if (!h) return;
      if (h.type === 'edit' && h.b.dept) {
        setEditingDept(h.b.dept);
      } else if (h.type === 'delete' && h.b.dept) {
        setDeletingDept(h.b.dept);
      } else if (h.type === 'select' && h.b.dept) {
        onSelect(h.b.dept);
      }
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(state.raf);
      clearInterval(pulseInterval);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      ro.disconnect();
      state.bubbles = [];
      state.pulses = [];
    };
  }, [departments, onSelect]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <div style={{ height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', borderBottom:'1px solid var(--border)', flexShrink:0, position:'relative', zIndex:10 }}>
        <span style={{ fontSize:20, fontWeight:800, color:'var(--accent)', letterSpacing:'0.12em', fontFamily:'Poppins, sans-serif' }}>NEXUS</span>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {!loading && departments.length > 0 && (
            <span style={{ fontSize:12, color:'var(--text3)', fontWeight:500 }}>
              {departments.length} departments · hover to explore · click to enter
            </span>
          )}
          <a
            href="/my-tasks"
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', background:'transparent', color:'var(--text2)', border:'1px solid var(--border2)', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer', textDecoration:'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--accent)'; (e.currentTarget as HTMLElement).style.color='var(--accent)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border2)'; (e.currentTarget as HTMLElement).style.color='var(--text2)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 3h11M1 6.5h8M1 10h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="11" cy="10" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
            My Tasks
          </a>
          <button
            onClick={async () => {
              setExporting(true);
              try {
                const res = await fetch('/api/export');
                if (!res.ok) throw new Error('Export failed');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nexus-export-${new Date().toISOString().slice(0,10)}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
                toast('Export downloaded successfully', 'success');
              } catch {
                toast('Export failed — please try again', 'error');
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', background:'transparent', color:'var(--text2)', border:'1px solid var(--border2)', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer', opacity:exporting?0.6:1 }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v7M3.5 5.5l3 3 3-3M1 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {exporting ? 'Exporting…' : 'Export Excel'}
          </button>
          <button onClick={() => setShowNew(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:9, fontWeight:600, fontSize:13, cursor:'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New Department
          </button>
          <TopbarUser />
        </div>
      </div>

      <div ref={containerRef} style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {loading && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', gap:12, color:'var(--text3)' }}>
            <div style={{ width:28, height:28, border:'2.5px solid var(--border2)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
            Loading…
          </div>
        )}
        {!loading && departments.length === 0 && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ fontSize:48 }}>🏢</div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text)' }}>No departments yet</div>
            <div style={{ fontSize:14, color:'var(--text3)' }}>Create your first department to get started</div>
            <button onClick={() => setShowNew(true)} style={{ marginTop:8, padding:'11px 24px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer' }}>
              + Create Department
            </button>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: departments.length > 0 ? 'block' : 'none', width:'100%', height:'100%' }} />

        {/* Speed control */}
        {departments.length > 0 && (
          <div style={{ position:'absolute', bottom:24, right:28, display:'flex', alignItems:'center', gap:10, background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:12, padding:'10px 16px', zIndex:20, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
            <span style={{ fontSize:13, userSelect:'none' }}>🐢</span>
            <input
              type="range" min={0} max={100} defaultValue={50} step={1}
              onChange={e => {
                // Exponential: 0→0.12×, 50→1×, 100→8×
                const t = Number(e.target.value) / 50 - 1; // -1 to +1
                const sm = Math.pow(8, t);
                speedRef.current = sm;
                setSpeedLabel(sm < 1 ? `${sm.toFixed(2)}×` : `${sm.toFixed(1)}×`);
              }}
              style={{ width:110, accentColor:'var(--accent)', cursor:'pointer' }}
            />
            <span style={{ fontSize:13, userSelect:'none' }}>🐇</span>
            <span style={{ fontSize:11, fontWeight:600, color:'var(--accent)', minWidth:34, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{speedLabel}</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showNew && (
        <NewDeptModal
          onClose={() => setShowNew(false)}
          onCreate={dept => {
            const { w, h, bubbles } = stateRef.current;
            bubbles.push({ x:90+Math.random()*(w-180), y:90+Math.random()*(h-180), vx:(Math.random()-.5)*.5, vy:(Math.random()-.5)*.5, r:46+Math.random()*18, alpha:0.88, scale:0.05, scaleV:0, targetScale:1, dept, hovered:false });
            setDepartments(prev => [...prev, dept]);
          }}
        />
      )}
      {editingDept && (
        <EditDeptModal
          dept={editingDept}
          onClose={() => setEditingDept(null)}
          onSave={updated => {
            for (const b of stateRef.current.bubbles) {
              if (b.dept?.id === updated.id) b.dept = updated;
            }
            setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
            setEditingDept(null);
            toast(`${updated.name} updated`, 'success');
          }}
        />
      )}
      {deletingDept && (
        <ConfirmDeleteModal
          dept={deletingDept}
          onClose={() => setDeletingDept(null)}
          onConfirm={async () => {
            const { id, name } = deletingDept;
            await apiDeleteDepartment(id);
            stateRef.current.bubbles = stateRef.current.bubbles.filter(b => b.dept?.id !== id);
            setDepartments(prev => prev.filter(d => d.id !== id));
            setDeletingDept(null);
            toast(`"${name}" deleted`, 'success');
          }}
        />
      )}
    </div>
  );
}
