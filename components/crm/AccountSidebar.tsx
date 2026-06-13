'use client';
import { useCrm } from '@/context/CrmContext';

const SEGMENT_COLOR: Record<string, string> = {
  Enterprise: 'var(--purple)',
  'Mid-Market': 'var(--blue)',
  SMB: 'var(--green)',
};

export function AccountSidebar() {
  const { state, dispatch } = useCrm();

  return (
    <aside style={{
      width: 260,
      minWidth: 260,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 4 }}>
          Accounts
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Serif Display, serif' }}>
          {state.accounts.length} Accounts
        </div>
      </div>

      <div style={{ flex: 1, padding: '8px 8px' }}>
        {state.accounts.map(acc => {
          const selected = acc.id === state.selectedAccountId;
          const openTasks = acc.tasks.filter(t => t.status !== 'Done').length;
          const critTasks = acc.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;

          return (
            <button
              key={acc.id}
              onClick={() => dispatch({ type: 'SELECT_ACCOUNT', id: acc.id })}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 'var(--r-sm)',
                background: selected ? 'var(--bg4)' : 'transparent',
                border: selected ? '1px solid var(--border2)' : '1px solid transparent',
                cursor: 'pointer',
                marginBottom: 2,
                transition: 'background 0.12s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: selected ? 'var(--text)' : 'var(--text)', lineHeight: 1.3 }}>
                  {acc.name}
                </span>
                {critTasks > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--red)',
                    background: 'var(--red-dim)', borderRadius: 99,
                    padding: '1px 6px', flexShrink: 0,
                  }}>
                    {critTasks} critical
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{acc.industry}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: SEGMENT_COLOR[acc.segment],
                  background: SEGMENT_COLOR[acc.segment] + '18',
                  borderRadius: 99, padding: '1px 6px',
                }}>
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
