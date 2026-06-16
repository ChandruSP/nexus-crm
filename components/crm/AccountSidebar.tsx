'use client';
import { useState } from 'react';
import { useCrm } from '@/context/CrmContext';

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

interface Props { onAddAccount: () => void; }

export function AccountSidebar({ onAddAccount }: Props) {
  const { state, dispatch } = useCrm();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggleGroup(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // Build grouped structure: [{groupId, groupName, accounts[]}] + ungrouped
  const groupMap = new Map<string, { name: string; accounts: typeof state.accounts }>();
  for (const g of state.groups) groupMap.set(g.id, { name: g.name, accounts: [] });

  const ungrouped: typeof state.accounts = [];
  for (const acc of state.accounts) {
    if (acc.groupId && groupMap.has(acc.groupId)) {
      groupMap.get(acc.groupId)!.accounts.push(acc);
    } else {
      ungrouped.push(acc);
    }
  }

  function AccountRow({ acc }: { acc: typeof state.accounts[0] }) {
    const selected  = acc.id === state.selectedAccountId;
    const openTasks = acc.tasks.filter(t => t.status !== 'Done').length;
    const critTasks = acc.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;
    const color     = avatarColor(acc.name);

    return (
      <button
        onClick={() => dispatch({ type: 'SELECT_ACCOUNT', id: acc.id })}
        style={{
          width: '100%', textAlign: 'left',
          padding: '10px 14px 10px 12px',
          background: selected ? 'var(--bg3)' : 'transparent',
          border: 'none',
          borderLeft: selected ? '3px solid var(--accent)' : '3px solid transparent',
          cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
        onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.02em', marginTop: 1,
        }}>
          {initials(acc.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {acc.name}
            </span>
            {critTasks > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', borderRadius: 99, padding: '1px 5px', flexShrink: 0 }}>
                {critTasks}!
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {acc.industry}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: SEGMENT_COLOR[acc.segment],
              background: SEGMENT_COLOR[acc.segment] + '18',
              borderRadius: 99, padding: '1px 6px',
              border: `1px solid ${SEGMENT_COLOR[acc.segment]}25`,
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {acc.segment}
            </span>
            {openTasks > 0 && (
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                {openTasks} task{openTasks !== 1 ? 's' : ''} open
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <aside style={{
      width: 264, minWidth: 264, flexShrink: 0,
      background: 'var(--bg2)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 1 }}>
            Accounts
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
            {state.accounts.length} Accounts
          </div>
        </div>
        <button
          onClick={onAddAccount}
          title="Add account"
          style={{
            width: 30, height: 30, borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border2)',
            background: 'var(--bg3)',
            color: 'var(--text2)',
            cursor: 'pointer', fontSize: 20, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 300, flexShrink: 0, transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)'; }}
        >
          +
        </button>
      </div>

      {/* Account list */}
      <div style={{ flex: 1, padding: '8px 0' }}>

        {/* Grouped accounts */}
        {Array.from(groupMap.entries()).map(([groupId, { name, accounts }]) => {
          if (accounts.length === 0) return null;
          const isCollapsed = collapsed.has(groupId);
          const groupCritical = accounts.reduce((n, a) => n + a.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length, 0);
          const groupOpen = accounts.reduce((n, a) => n + a.tasks.filter(t => t.status !== 'Done').length, 0);

          return (
            <div key={groupId}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(groupId)}
                style={{
                  width: '100%', textAlign: 'left', padding: '7px 14px 7px 12px',
                  background: 'transparent', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 9, color: 'var(--text3)', transition: 'transform 0.15s', display: 'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{accounts.length}</span>
                {groupCritical > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)', background: 'var(--red-dim)', borderRadius: 99, padding: '1px 5px', flexShrink: 0 }}>
                    {groupCritical}!
                  </span>
                )}
                {groupOpen > 0 && groupCritical === 0 && (
                  <span style={{ fontSize: 9, color: 'var(--text3)', flexShrink: 0 }}>{groupOpen}t</span>
                )}
              </button>

              {/* Accounts under this group */}
              {!isCollapsed && accounts.map(acc => <AccountRow key={acc.id} acc={acc} />)}
            </div>
          );
        })}

        {/* Ungrouped accounts */}
        {ungrouped.length > 0 && state.groups.length > 0 && (
          <div>
            <div style={{ padding: '7px 14px 4px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Other
            </div>
            {ungrouped.map(acc => <AccountRow key={acc.id} acc={acc} />)}
          </div>
        )}

        {/* No groups — show flat list */}
        {state.groups.length === 0 && state.accounts.map(acc => <AccountRow key={acc.id} acc={acc} />)}
      </div>
    </aside>
  );
}
