'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { OverviewTab } from './OverviewTab';
import { TasksTab } from './TasksTab';
import { StakeholdersTab } from './StakeholdersTab';
import { OpportunitiesTab } from './OpportunitiesTab';

type Tab = 'overview' | 'tasks' | 'stakeholders' | 'opportunities';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',      label: 'Overview' },
  { key: 'tasks',         label: 'Tasks' },
  { key: 'stakeholders',  label: 'Stakeholders' },
  { key: 'opportunities', label: 'Opportunities' },
];

const SEGMENT_COLOR: Record<string, string> = {
  Enterprise:  'var(--purple)',
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
      fontFamily: 'DM Serif Display, serif',
    }}>
      {initials}
    </div>
  );
}

export function AccountDetail() {
  const { state } = useCrm();
  const [tab, setTab] = useState<Tab>('overview');

  const account = state.accounts.find(a => a.id === state.selectedAccountId);

  if (!account) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
        Select an account from the left
      </div>
    );
  }

  const openTasks = account.tasks.filter(t => t.status !== 'Done').length;
  const critTasks = account.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;

  const tabCount: Partial<Record<Tab, number>> = {
    tasks:         openTasks,
    stakeholders:  account.stakeholders.length,
    opportunities: account.opportunities.length,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ padding: '20px 28px 0', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
          <InitialAvatar name={account.name} />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: 'DM Serif Display, serif', lineHeight: 1.2 }}>
                {account.name}
              </h1>
              <span style={{ fontSize: 10, fontWeight: 700, color: SEGMENT_COLOR[account.segment], background: SEGMENT_COLOR[account.segment] + '18', borderRadius: 99, padding: '2px 8px', border: `1px solid ${SEGMENT_COLOR[account.segment]}30` }}>
                {account.segment}
              </span>
              {critTasks > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', borderRadius: 99, padding: '2px 8px', border: '1px solid rgba(217,48,37,0.2)' }}>
                  {critTasks} critical
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
              {[
                account.industry,
                account.location,
                account.owner ? `Owner: ${account.owner}` : null,
              ].filter(Boolean).map((item, i, arr) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{item}</span>
                  {i < arr.length - 1 && <span style={{ margin: '0 8px', color: 'var(--border3)', fontSize: 10 }}>·</span>}
                </span>
              ))}
              {account.website && (
                <>
                  <span style={{ margin: '0 8px', color: 'var(--border3)', fontSize: 10 }}>·</span>
                  <a href={`https://${account.website}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                    {account.website} ↗
                  </a>
                </>
              )}
            </div>
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
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                    borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'var(--accent)' : 'var(--bg4)',
                    color: active ? '#fff' : 'var(--text3)',
                    padding: '0 4px',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {tab === 'overview'      && <OverviewTab      account={account} />}
        {tab === 'tasks'         && <TasksTab         account={account} />}
        {tab === 'stakeholders'  && <StakeholdersTab  account={account} />}
        {tab === 'opportunities' && <OpportunitiesTab account={account} />}
      </div>
    </div>
  );
}
