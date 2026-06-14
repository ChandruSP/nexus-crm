'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { useToast } from '@/context/ToastContext';
import { Account } from '@/lib/crmTypes';
import { AccountDetail } from './AccountDetail';
import { NewAccountPanel } from './NewAccountPanel';

type Mode = 'grid' | 'detail' | 'new';

const SEGMENT_COLOR: Record<string, string> = {
  Enterprise:   'var(--purple)',
  'Mid-Market': 'var(--blue)',
  SMB:          'var(--green)',
};

function avatarColor(name: string) {
  const hue = name.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue},50%,48%)`;
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n === 0)       return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

function AccountCard({ account, onClick }: { account: Account; onClick: () => void }) {
  const openTasks  = account.tasks.filter(t => t.status !== 'Done').length;
  const critTasks  = account.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;
  const revenue    = account.pastProjects.reduce((s, p) => s + p.revenue, 0);
  const openOpp    = account.opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost');
  const pipeline   = openOpp.reduce((s, o) => s + o.value * (o.probability / 100), 0);

  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: 0, background: 'var(--bg2)',
      border: '1px solid var(--border)', borderRadius: 'var(--r)',
      cursor: 'pointer', display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s, box-shadow 0.15s', overflow: 'hidden',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Top accent strip */}
      <div style={{ height: 3, background: avatarColor(account.name), width: '100%', flexShrink: 0 }} />

      <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: avatarColor(account.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
          }}>
            {initials(account.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {account.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                color: SEGMENT_COLOR[account.segment], background: SEGMENT_COLOR[account.segment] + '18',
                borderRadius: 99, padding: '1px 7px', border: `1px solid ${SEGMENT_COLOR[account.segment]}28`,
              }}>
                {account.segment}
              </span>
              {critTasks > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', borderRadius: 99, padding: '1px 7px' }}>
                  {critTasks} critical
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.5 }}>
          {[account.industry, account.location, account.owner && `Owner: ${account.owner}`].filter(Boolean).join(' · ')}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {[
            { label: 'Revenue',   value: fmtCurrency(revenue) },
            { label: 'Pipeline',  value: fmtCurrency(pipeline) },
            { label: 'Open tasks',value: openTasks || '—' },
          ].map((s, i) => (
            <div key={s.label} style={{ textAlign: i === 0 ? 'left' : i === 1 ? 'center' : 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}

const GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 };

export function AccountsView() {
  const { state, dispatch } = useCrm();
  const { toast } = useToast();
  const [mode,      setMode]      = useState<Mode>('grid');
  const [search,    setSearch]    = useState('');
  const [viewMode,  setViewMode]  = useState<'flat' | 'grouped'>('flat');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = state.accounts.filter(a =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.industry.toLowerCase().includes(search.toLowerCase()) ||
    a.owner.toLowerCase().includes(search.toLowerCase())
  );

  // accounts that belong to a group (for grouped view)
  const grouped = filtered.reduce<Record<string, Account[]>>((acc, a) => {
    const key = a.group ?? '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});
  const groupNames   = Object.keys(grouped).filter(k => k !== '').sort();
  const ungrouped    = grouped[''] ?? [];
  const hasAnyGroups = state.accounts.some(a => a.group);

  function toggleCollapse(name: string) {
    setCollapsed(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }

  function openAccount(id: string) {
    dispatch({ type: 'SELECT_ACCOUNT', id });
    setMode('detail');
  }

  const viewBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 99,
    background: active ? 'var(--bg4)' : 'transparent',
    border: active ? '1px solid var(--border2)' : '1px solid transparent',
    color: active ? 'var(--text)' : 'var(--text3)',
  });

  if (mode === 'detail') {
    return <AccountDetail onBack={() => setMode('grid')} />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {mode === 'new' && <NewAccountPanel onDone={() => { toast('Account created'); setMode('detail'); }} onCancel={() => setMode('grid')} />}

      {/* Toolbar */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 1 }}>Accounts</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>
            {state.accounts.length} Account{state.accounts.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ position: 'absolute', left: 10, pointerEvents: 'none', color: 'var(--text3)' }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)}
              style={{
                padding: '7px 12px 7px 30px', fontSize: 12, borderRadius: 'var(--r-sm)',
                background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)',
                outline: 'none', width: 200,
              }}
            />
          </div>

          {/* Flat / Grouped toggle — only shown when groups exist */}
          {hasAnyGroups && (
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', borderRadius: 99, padding: 2 }}>
              <button style={viewBtnStyle(viewMode === 'flat')}    onClick={() => setViewMode('flat')}>Flat</button>
              <button style={viewBtnStyle(viewMode === 'grouped')} onClick={() => setViewMode('grouped')}>Grouped</button>
            </div>
          )}

          <button onClick={() => setMode('new')} style={{
            padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16, fontWeight: 300, lineHeight: 1 }}>+</span> New Account
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontSize: 13 }}>
            {search ? 'No accounts match your search.' : 'No accounts yet — add one to get started.'}
          </div>
        ) : viewMode === 'flat' || !hasAnyGroups ? (
          <div style={GRID}>
            {filtered.map(acc => <AccountCard key={acc.id} account={acc} onClick={() => openAccount(acc.id)} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Named groups */}
            {groupNames.map(name => {
              const members  = grouped[name] ?? [];
              const isCollapsed = collapsed.has(name);
              const totalOpp = members.reduce((s, a) => s + a.opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').reduce((ss, o) => ss + o.value * (o.probability / 100), 0), 0);
              const openTasks = members.reduce((s, a) => s + a.tasks.filter(t => t.status !== 'Done').length, 0);
              return (
                <div key={name}>
                  {/* Group header */}
                  <button onClick={() => toggleCollapse(name)} style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: isCollapsed ? 0 : 12,
                    padding: '8px 0',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                      style={{ color: 'var(--text3)', flexShrink: 0, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                      <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{members.length} account{members.length !== 1 ? 's' : ''}</span>
                    {openTasks > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-dim)', borderRadius: 99, padding: '1px 7px' }}>{openTasks} open tasks</span>}
                    {totalOpp > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', borderRadius: 99, padding: '1px 7px' }}>
                      ₹{totalOpp >= 10000000 ? `${(totalOpp / 10000000).toFixed(1)}Cr` : `${(totalOpp / 100000).toFixed(1)}L`} pipeline
                    </span>}
                    <div style={{ flex: 1, height: 1, background: 'var(--border)', marginLeft: 4 }} />
                  </button>
                  {!isCollapsed && (
                    <div style={{ ...GRID, paddingLeft: 20, borderLeft: '2px solid var(--border2)' }}>
                      {members.map(acc => <AccountCard key={acc.id} account={acc} onClick={() => openAccount(acc.id)} />)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped accounts */}
            {ungrouped.length > 0 && (
              <div>
                {groupNames.length > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                    Other Accounts
                  </div>
                )}
                <div style={GRID}>
                  {ungrouped.map(acc => <AccountCard key={acc.id} account={acc} onClick={() => openAccount(acc.id)} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
