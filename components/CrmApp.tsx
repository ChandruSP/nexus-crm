'use client';
import { useEffect, useState } from 'react';
import { CrmProvider } from '@/context/CrmContext';
import { AccountSidebar } from './crm/AccountSidebar';
import { AccountDetail } from './crm/AccountDetail';
import { TaskKanban } from './crm/TaskKanban';

type AppView = 'accounts' | 'tasks';

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
        width: 32, height: 20, borderRadius: 99,
        border: '1.5px solid var(--border2)',
        background: dark ? 'var(--accent)' : 'var(--bg4)',
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: dark ? 13 : 2,
        width: 12, height: 12, borderRadius: '50%',
        background: dark ? '#000' : 'var(--text3)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '100%',
        padding: '0 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
        color: active ? 'var(--text)' : 'var(--text3)',
        fontWeight: active ? 600 : 400,
        fontSize: 13,
        cursor: 'pointer',
        letterSpacing: '0.01em',
        transition: 'color 0.12s',
      }}
    >
      {label}
    </button>
  );
}

export function CrmApp() {
  const [view, setView] = useState<AppView>('accounts');

  return (
    <CrmProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          height: 48, flexShrink: 0,
          background: 'var(--bg2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'stretch',
          padding: '0 20px', gap: 0, zIndex: 100,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 24, gap: 10 }}>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: 'var(--text)', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Pulse
            </span>
          </div>

          {/* Nav tabs */}
          <NavTab label="Accounts"  active={view === 'accounts'} onClick={() => setView('accounts')} />
          <NavTab label="Tasks"     active={view === 'tasks'}    onClick={() => setView('tasks')} />

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {view === 'accounts' && (
            <>
              <AccountSidebar />
              <AccountDetail />
            </>
          )}
          {view === 'tasks' && <TaskKanban />}
        </div>

      </div>
    </CrmProvider>
  );
}
