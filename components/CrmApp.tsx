'use client';
import { useEffect, useState } from 'react';
import { CrmProvider } from '@/context/CrmContext';
import { ConfigProvider } from '@/context/ConfigContext';
import { AccountsView } from './crm/AccountsView';
import { TasksView } from './crm/TasksView';
import { ConfigView } from './crm/ConfigView';

type AppView = 'accounts' | 'tasks' | 'config';

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
    <button onClick={toggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ width:32, height:20, borderRadius:99, border:'1.5px solid var(--border2)', background: dark ? 'var(--accent)' : 'var(--bg4)', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:2, left: dark ? 13 : 2, width:12, height:12, borderRadius:'50%', background: dark ? '#000' : 'var(--text3)', transition:'left 0.2s' }} />
    </button>
  );
}

function NavTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      height:'100%', padding:'0 16px', background:'transparent', border:'none',
      borderBottom: active ? '2px solid var(--text)' : '2px solid transparent',
      color: active ? 'var(--text)' : 'var(--text3)',
      fontWeight: active ? 600 : 400, fontSize:13, cursor:'pointer',
      letterSpacing:'0.01em', transition:'color 0.12s',
    }}>
      {label}
    </button>
  );
}

export function CrmApp() {
  const [view, setView] = useState<AppView>('accounts');

  return (
    <ConfigProvider>
      <CrmProvider>
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)', fontFamily:'Instrument Sans, sans-serif', overflow:'hidden' }}>

          {/* Topbar */}
          <div style={{ height:48, flexShrink:0, background:'var(--bg2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'stretch', padding:'0 20px', gap:0, zIndex:100 }}>
            <div style={{ display:'flex', alignItems:'center', marginRight:24 }}>
              <span style={{ fontFamily:'DM Serif Display, serif', fontSize:18, color:'var(--text)', fontWeight:700, letterSpacing:'-0.01em' }}>Pulse</span>
            </div>
            <NavTab label="Accounts" active={view === 'accounts'} onClick={() => setView('accounts')} />
            <NavTab label="Tasks"    active={view === 'tasks'}    onClick={() => setView('tasks')} />
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
              <button onClick={() => setView('config')} title="Settings"
                style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                  background: view === 'config' ? 'var(--bg4)' : 'none',
                  border: view === 'config' ? '1px solid var(--border2)' : '1px solid transparent',
                  borderRadius:'var(--r-sm)', cursor:'pointer', color: view === 'config' ? 'var(--text)' : 'var(--text3)' }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 9.5a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M12.2 7.5c0-.18-.01-.36-.04-.53l1.14-.88a.3.3 0 00.07-.38l-1.08-1.87a.3.3 0 00-.37-.13l-1.34.54a3.9 3.9 0 00-.92-.53l-.2-1.43A.3.3 0 009.17 2H6.83a.3.3 0 00-.3.25l-.2 1.43c-.34.14-.65.32-.92.53l-1.34-.54a.3.3 0 00-.37.13L2.62 5.7a.3.3 0 00.07.38l1.14.88c-.03.17-.04.35-.04.53s.01.36.04.53l-1.14.88a.3.3 0 00-.07.38l1.08 1.87c.08.14.25.19.37.13l1.34-.54c.27.21.58.39.92.53l.2 1.43c.04.14.16.25.3.25h2.34c.14 0 .26-.11.3-.25l.2-1.43c.34-.14.65-.32.92-.53l1.34.54c.12.06.29.01.37-.13l1.08-1.87a.3.3 0 00-.07-.38l-1.14-.88c.03-.17.04-.35.04-.53z" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* Body */}
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {view === 'accounts' && <AccountsView />}
            {view === 'tasks'    && <TasksView />}
            {view === 'config'   && <ConfigView />}
          </div>
        </div>
      </CrmProvider>
    </ConfigProvider>
  );
}
