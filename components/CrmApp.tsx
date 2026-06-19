'use client';
import { useEffect, useState } from 'react';
import { CrmProvider } from '@/context/CrmContext';
import { useCrm } from '@/context/CrmContext';
import { ConfigProvider } from '@/context/ConfigContext';
import { ToastProvider } from '@/context/ToastContext';
import { ToastContainer } from './Toast';
import { AccountsView } from './crm/AccountsView';
import { TasksView } from './crm/TasksView';
import { ConfigView } from './crm/ConfigView';
import { SplashScreen } from './SplashScreen';
import { DepartmentSelector } from './DepartmentSelector';
import { Department } from '@/lib/apiClient';

type AppView = 'tasks' | 'accounts' | 'config';

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('nexus-theme');
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexus-theme', theme);
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

function CrmBody({ view }: { view: AppView }) {
  const { state } = useCrm();
  if (state.loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {view === 'tasks'    && <TasksView />}
      {view === 'accounts' && <AccountsView />}
      {view === 'config'   && <ConfigView />}
    </div>
  );
}

function DeptDot({ color }: { color: string }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 6, flexShrink: 0 }} />;
}

function CrmShell({ department, onBack }: { department: Department; onBack: () => void }) {
  const [view, setView] = useState<AppView>('tasks');

  return (
    <CrmProvider key={department.id} departmentId={department.id}>
      <ConfigProvider key={department.id} departmentId={department.id}>
        <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)', fontFamily:'Instrument Sans, sans-serif', overflow:'hidden' }}>

          {/* Topbar */}
          <div style={{ height:48, flexShrink:0, background:'var(--bg2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'stretch', padding:'0 20px', gap:0, zIndex:100 }}>

            {/* Back + logo + dept name */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:20 }}>
              <button
                onClick={onBack}
                title="All departments"
                style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 8px', background:'none', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', cursor:'pointer', color:'var(--text3)', fontSize:12, transition:'color 0.12s, border-color 0.12s' }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--text)'; b.style.borderColor = 'var(--text2)'; }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'var(--border2)'; }}
              >
                ← Depts
              </button>
              <span style={{ fontSize:18, color:'var(--accent)', fontWeight:800, letterSpacing:'0.08em', fontFamily:'Poppins, sans-serif' }}>NEXUS</span>
              <span style={{ fontSize:11, color:'var(--text3)', margin:'0 2px' }}>·</span>
              <DeptDot color={department.color} />
              <span style={{ fontSize:13, fontWeight:600, color:'var(--text2)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {department.icon} {department.name}
              </span>
            </div>

            <NavTab label="Tasks"    active={view === 'tasks'}    onClick={() => setView('tasks')} />
            {department.hasAccounts && <NavTab label="Accounts" active={view === 'accounts'} onClick={() => setView('accounts')} />}

            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
              <button onClick={() => setView('config')} title="Settings"
                style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                  background: view === 'config' ? 'var(--bg4)' : 'none',
                  border: view === 'config' ? '1px solid var(--border2)' : '1px solid transparent',
                  borderRadius:'var(--r-sm)', cursor:'pointer', color: view === 'config' ? 'var(--text)' : 'var(--text3)',
                  transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
                onMouseEnter={e => { if (view !== 'config') { const b = e.currentTarget; b.style.color = 'var(--text)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'var(--bg4)'; } }}
                onMouseLeave={e => { if (view !== 'config') { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'transparent'; b.style.background = 'none'; } }}>
                <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
                  <path d="M7.5 9.5a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M12.2 7.5c0-.18-.01-.36-.04-.53l1.14-.88a.3.3 0 00.07-.38l-1.08-1.87a.3.3 0 00-.37-.13l-1.34.54a3.9 3.9 0 00-.92-.53l-.2-1.43A.3.3 0 009.17 2H6.83a.3.3 0 00-.3.25l-.2 1.43c-.34.14-.65.32-.92.53l-1.34-.54a.3.3 0 00-.37.13L2.62 5.7a.3.3 0 00.07.38l1.14.88c-.03.17-.04.35-.04.53s.01.36.04.53l-1.14.88a.3.3 0 00-.07.38l1.08 1.87c.08.14.25.19.37.13l1.34-.54c.27.21.58.39.92.53l.2 1.43c.04.14.16.25.3.25h2.34c.14 0 .26-.11.3-.25l.2-1.43c.34-.14.65-.32.92-.53l1.34.54c.12.06.29.01.37-.13l1.08-1.87a.3.3 0 00-.07-.38l-1.14-.88c.03-.17.04-.35.04-.53z" stroke="currentColor" strokeWidth="1.4"/>
                </svg>
              </button>
              <ThemeToggle />
            </div>
          </div>

          {/* Body */}
          <CrmBody view={view} />
        </div>
      </ConfigProvider>
    </CrmProvider>
  );
}

export function CrmApp() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [splash, setSplash] = useState(true);

  return (
    <ToastProvider>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      {!department
        ? <DepartmentSelector onSelect={setDepartment} />
        : <CrmShell department={department} onBack={() => setDepartment(null)} />
      }
      <ToastContainer />
    </ToastProvider>
  );
}
