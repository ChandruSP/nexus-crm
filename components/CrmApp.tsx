'use client';
import { useEffect, useState } from 'react';
import { CrmProvider } from '@/context/CrmContext';
import { AccountSidebar } from './crm/AccountSidebar';
import { AccountDetail } from './crm/AccountDetail';

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pulse-theme');
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pulse-theme', theme);
  }

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        marginLeft: 'auto',
        width: 32, height: 20,
        borderRadius: 99,
        border: '1.5px solid var(--border2)',
        background: dark ? 'var(--accent)' : 'var(--bg4)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2,
        left: dark ? 13 : 2,
        width: 12, height: 12,
        borderRadius: '50%',
        background: dark ? '#000' : 'var(--text3)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

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
          <ThemeToggle />
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
