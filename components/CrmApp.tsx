'use client';
import { CrmProvider } from '@/context/CrmContext';
import { AccountSidebar } from './crm/AccountSidebar';
import { AccountDetail } from './crm/AccountDetail';

export function CrmApp() {
  return (
    <CrmProvider>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 48, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 100, gap: 12 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text)', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Pulse
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', paddingLeft: 12, borderLeft: '1px solid var(--border2)' }}>
            Account Management
          </div>
        </div>

        {/* Body below topbar */}
        <div style={{ display: 'flex', flex: 1, marginTop: 48, overflow: 'hidden' }}>
          <AccountSidebar />
          <AccountDetail />
        </div>
      </div>
    </CrmProvider>
  );
}
