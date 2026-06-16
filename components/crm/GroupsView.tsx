'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Group } from '@/lib/crmTypes';

function fmtM(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function avatarColor(name: string) {
  const hue = name.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue},55%,46%)`;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── New / Edit Group Modal ────────────────────────────────────────────────────
function GroupModal({ group, onClose }: { group?: Group; onClose: () => void }) {
  const { state, dispatch } = useCrm();
  const [form, setForm] = useState({ name: group?.name ?? '', industry: group?.industry ?? '', description: group?.description ?? '' });
  const [err, setErr] = useState('');
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 'var(--r-sm)', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--text3)', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' };

  const industries = ['Banking & Finance','Supply Chain & Logistics','Healthcare & Life Sciences','Technology','Manufacturing','Retail','Energy','Telecom','Government','Media & Entertainment','Education','Real Estate'];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Group name is required'); return; }
    if (group) {
      dispatch({ type: 'UPDATE_GROUP', group: { ...group, ...form } });
    } else {
      dispatch({ type: 'ADD_GROUP', group: { id: `g-${Date.now()}`, ...form } });
    }
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 600 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 601, background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 440, maxWidth: '90vw', boxShadow: '0 16px 48px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>{group ? 'Edit Group' : 'New Group'}</div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={lbl}>Group Name *</label>
            <input style={{ ...inp, borderColor: err ? 'var(--red)' : 'var(--border2)' }} value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErr(''); }} placeholder="e.g. Tata Group" autoFocus />
            {err && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{err}</div>}
          </div>
          <div>
            <label style={lbl}>Primary Industry</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              <option value="">Select…</option>
              {industries.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Notes about this group…" />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {group ? 'Save Changes' : 'Create Group'}
            </button>
            <button type="button" onClick={onClose} style={{ padding: '8px 14px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Group Detail Panel ────────────────────────────────────────────────────────
function GroupDetail({ group, onEdit, onClose }: { group: Group; onEdit: () => void; onClose: () => void }) {
  const { state, dispatch } = useCrm();
  const accounts = state.accounts.filter(a => a.groupId === group.id);

  const pipeline = accounts.reduce((s, a) => s + a.opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).reduce((n, o) => n + o.value * (o.probability / 100), 0), 0);
  const revenue  = accounts.reduce((s, a) => s + a.pastProjects.reduce((n, p) => n + p.revenue, 0), 0);
  const openTasks = accounts.reduce((s, a) => s + a.tasks.filter(t => t.status !== 'Done').length, 0);
  const critTasks = accounts.reduce((s, a) => s + a.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length, 0);
  const wonOpps   = accounts.reduce((s, a) => s + a.opportunities.filter(o => o.stage === 'Closed Won').length, 0);

  const stat = (label: string, value: string, color?: string) => (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '4px 10px', fontSize: 12, color: 'var(--text3)', cursor: 'pointer' }}>← Back</button>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: avatarColor(group.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
          {initials(group.name)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{group.name}</div>
          {group.industry && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{group.industry}</div>}
        </div>
        <button onClick={onEdit} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>
          Edit Group
        </button>
        <button
          onClick={() => {
            if (!confirm(`Delete group "${group.name}"? Accounts will be ungrouped.`)) return;
            dispatch({ type: 'DELETE_GROUP', groupId: group.id });
            onClose();
          }}
          style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 'var(--r-sm)' }}
        >
          Delete
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {/* Description */}
        {group.description && (
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.6 }}>{group.description}</div>
        )}

        {/* Rollup stats */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Group Rollup</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
          {stat('Accounts', String(accounts.length))}
          {stat('Wtd Pipeline', fmtM(pipeline), 'var(--accent)')}
          {stat('Past Revenue', fmtM(revenue))}
          {stat('Open Tasks', String(openTasks), openTasks > 0 ? 'var(--amber)' : undefined)}
          {critTasks > 0 && stat('Critical Tasks', String(critTasks), 'var(--red)')}
          {stat('Deals Won', String(wonOpps), wonOpps > 0 ? 'var(--green)' : undefined)}
        </div>

        {/* Accounts list */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Accounts ({accounts.length})
        </div>
        {accounts.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text3)', padding: '32px 0', textAlign: 'center', border: '1.5px dashed var(--border2)', borderRadius: 'var(--r)' }}>
            No accounts in this group yet. Assign accounts from the Accounts view.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {accounts.map(acc => {
              const open = acc.tasks.filter(t => t.status !== 'Done').length;
              const crit = acc.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;
              const pipe = acc.opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).reduce((n, o) => n + o.value * (o.probability / 100), 0);

              return (
                <div key={acc.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: avatarColor(acc.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {initials(acc.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{acc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{acc.industry} · {acc.owner}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                    {pipe > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{fmtM(pipe)}</div>}
                    {open > 0 && <div style={{ fontSize: 11, color: crit > 0 ? 'var(--red)' : 'var(--text3)' }}>{open} task{open !== 1 ? 's' : ''}{crit > 0 ? ` (${crit}!)` : ''}</div>}
                    {open === 0 && pipe === 0 && <div style={{ fontSize: 11, color: 'var(--text3)' }}>No activity</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main GroupsView ───────────────────────────────────────────────────────────
export function GroupsView() {
  const { state, dispatch } = useCrm();
  const [showNew, setShowNew] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  if (selectedGroup) {
    const liveGroup = state.groups.find(g => g.id === selectedGroup.id) ?? selectedGroup;
    return (
      <>
        <GroupDetail
          group={liveGroup}
          onEdit={() => setEditGroup(liveGroup)}
          onClose={() => setSelectedGroup(null)}
        />
        {editGroup && (
          <GroupModal group={editGroup} onClose={() => setEditGroup(null)} />
        )}
      </>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 1 }}>Account Groups</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{state.groups.length} Group{state.groups.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 18, fontWeight: 300, lineHeight: 1 }}>+</span> New Group
        </button>
      </div>

      {/* Groups grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {state.groups.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>No groups yet. Create one to start organizing accounts.</div>
            <button onClick={() => setShowNew(true)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-sm)' }}>
              + Create First Group
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
            {state.groups.map(group => {
              const accounts = state.accounts.filter(a => a.groupId === group.id);
              const pipeline = accounts.reduce((s, a) => s + a.opportunities.filter(o => !['Closed Won','Closed Lost'].includes(o.stage)).reduce((n, o) => n + o.value * (o.probability / 100), 0), 0);
              const openTasks = accounts.reduce((s, a) => s + a.tasks.filter(t => t.status !== 'Done').length, 0);
              const critTasks = accounts.reduce((s, a) => s + a.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length, 0);
              const revenue = accounts.reduce((s, a) => s + a.pastProjects.reduce((n, p) => n + p.revenue, 0), 0);

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px', cursor: 'pointer', transition: 'border-color 0.12s, box-shadow 0.12s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border2)'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none'; }}
                >
                  {/* Group header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: avatarColor(group.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials(group.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                      {group.industry && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{group.industry}</div>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 99, padding: '2px 8px', border: '1px solid var(--border)', flexShrink: 0 }}>
                      {accounts.length} acct{accounts.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Pipeline</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{fmtM(pipeline)}</div>
                    </div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Revenue</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmtM(revenue)}</div>
                    </div>
                    <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tasks</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: critTasks > 0 ? 'var(--red)' : openTasks > 0 ? 'var(--amber)' : 'var(--text3)' }}>
                        {openTasks}{critTasks > 0 ? ` (${critTasks}!)` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Account names preview */}
                  {accounts.length > 0 && (
                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {accounts.map(a => a.name).join(' · ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && <GroupModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
