'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { useToast } from '@/context/ToastContext';
import { OverviewTab } from './OverviewTab';
import { TasksTab } from './TasksTab';
import { StakeholdersTab } from './StakeholdersTab';
import { OpportunitiesTab } from './OpportunitiesTab';
import { EditAccountPanel } from './EditAccountPanel';

type Tab = 'overview' | 'tasks' | 'stakeholders' | 'opportunities';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',      label: 'Overview' },
  { key: 'tasks',         label: 'Tasks' },
  { key: 'stakeholders',  label: 'Stakeholders' },
  { key: 'opportunities', label: 'Opportunities' },
];

const SEGMENT_COLOR: Record<string, string> = {
  Enterprise:   'var(--purple)',
  'Mid-Market': 'var(--blue)',
  SMB:          'var(--green)',
};

function InitialAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.split('').reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 'var(--r-sm)', flexShrink: 0,
      background: `hsl(${hue},55%,55%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
    }}>
      {initials}
    </div>
  );
}

export function AccountDetail({ onBack }: { onBack?: () => void }) {
  const { state, dispatch } = useCrm();
  const { toast } = useToast();
  const [tab, setTab]           = useState<Tab>('overview');
  const [editing, setEditing]   = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const account = state.accounts.find(a => a.id === state.selectedAccountId);

  if (!account) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
      Select an account
    </div>
  );

  // EditAccountPanel renders as a modal overlay — no early return needed

  const openTasks = account.tasks.filter(t => t.status !== 'Done').length;
  const critTasks = account.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;
  const tabCount: Partial<Record<Tab, number>> = {
    tasks:         openTasks,
    stakeholders:  account.stakeholders.length,
    opportunities: account.opportunities.length,
  };

  function handleDelete() {
    dispatch({ type: 'DELETE_ACCOUNT', accountId: account!.id });
    toast('Account deleted', 'info');
    setDelConfirm(false);
    onBack?.();
  }

  const iconBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 'var(--r-sm)',
    border: '1px solid var(--border2)', background: 'transparent',
    fontSize: 12, cursor: 'pointer', color: 'var(--text2)', fontWeight: 500,
    transition: 'color 0.12s, border-color 0.12s, background 0.12s',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '20px 28px 0', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>

        {onBack && (
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, padding: '0 0 14px 0', fontWeight: 500, transition: 'color 0.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All Accounts
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <InitialAvatar name={account.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>{account.name}</h1>
              <span style={{ fontSize: 10, fontWeight: 700, color: SEGMENT_COLOR[account.segment], background: SEGMENT_COLOR[account.segment] + '18', borderRadius: 99, padding: '2px 8px', border: `1px solid ${SEGMENT_COLOR[account.segment]}30` }}>
                {account.segment}
              </span>
              {critTasks > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', borderRadius: 99, padding: '2px 8px', border: '1px solid rgba(217,48,37,0.2)' }}>
                  {critTasks} critical
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              {[account.industry, account.location, account.owner ? `Owner: ${account.owner}` : null].filter(Boolean).map((item, i, arr) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{item}</span>
                  {i < arr.length - 1 && <span style={{ margin: '0 8px', color: 'var(--border3)', fontSize: 10 }}>·</span>}
                </span>
              ))}
              {account.website && (
                <><span style={{ margin: '0 8px', color: 'var(--border3)', fontSize: 10 }}>·</span>
                  <a href={`https://${account.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>{account.website} ↗</a>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignSelf: 'flex-start' }}>
            <button style={iconBtn} onClick={() => setEditing(true)}
              onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--accent)'; b.style.borderColor = 'var(--accent)'; b.style.background = 'var(--accent-dim)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text2)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 1.5l3 3L5 12H2V9L9.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Edit
            </button>
            <button style={{ ...iconBtn, color: 'var(--red)', borderColor: 'var(--red-dim)' }} onClick={() => setDelConfirm(true)}
              onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--red)'; b.style.borderColor = 'var(--red-dim)'; b.style.background = 'transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const count  = tabCount[t.key];
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '8px 16px', background: 'transparent', border: 'none',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                color: active ? 'var(--text)' : 'var(--text3)',
                fontWeight: active ? 600 : 400, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1,
              }}>
                {t.label}
                {count !== undefined && count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, minWidth: 16, height: 16, borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: active ? 'var(--accent)' : 'var(--bg4)', color: active ? '#fff' : 'var(--text3)', padding: '0 4px' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {editing && (
        <EditAccountPanel
          account={account}
          onDone={() => { setEditing(false); toast('Account updated'); }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {tab === 'overview'      && <OverviewTab      account={account} />}
        {tab === 'tasks'         && <TasksTab         account={account} />}
        {tab === 'stakeholders'  && <StakeholdersTab  account={account} />}
        {tab === 'opportunities' && <OpportunitiesTab account={account} />}
      </div>

      {/* Delete confirmation modal */}
      {delConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setDelConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)', padding: '24px 28px', width: 380, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete account?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              <strong style={{ color: 'var(--text)' }}>{account.name}</strong> and all its tasks, stakeholders, and opportunities will be permanently deleted.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDelConfirm(false)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
