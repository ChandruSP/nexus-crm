'use client';
import { useEffect, useState, useCallback } from 'react';
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

function CrmBody({ view, isKam }: { view: AppView; isKam: boolean }) {
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
      {view === 'config'   && <ConfigView isKam={isKam} />}
    </div>
  );
}

function UserChip() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(d => setUser(d.user));
  }, []);
  const name = user?.name || user?.email || '';
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  async function handleSignOut() {
    await fetch('/api/session', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
        {initials}
      </div>
      <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {name}
      </span>
      <button
        onClick={handleSignOut}
        style={{ marginLeft:4, padding:'3px 10px', fontSize:11, fontWeight:600, color:'var(--text3)', background:'transparent', border:'1px solid var(--border2)', borderRadius:6, cursor:'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='var(--text3)'; }}
        onMouseLeave={e => { e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.borderColor='var(--border2)'; }}
      >
        Sign out
      </button>
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
            <NavTab label="Settings" active={view === 'config'}   onClick={() => setView('config')} />

            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
              <ThemeToggle />
              <UserChip />
            </div>
          </div>

          {/* Body */}
          <CrmBody view={view} isKam={department.hasAccounts} />
        </div>
      </ConfigProvider>
    </CrmProvider>
  );
}

function deptSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function CrmApp() {
  const [department, setDepartment] = useState<Department | null>(null);
  const [splash, setSplash] = useState(true);
  // pendingSlug: read from URL on first load so DepartmentSelector can auto-select
  const [pendingSlug, setPendingSlug] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const m = window.location.pathname.match(/^\/d\/(.+)/);
    return m ? m[1] : null;
  });

  function enterDept(dept: Department) {
    setDepartment(dept);
    window.history.pushState({}, '', `/d/${deptSlug(dept.name)}`);
  }

  function leaveDept() {
    setDepartment(null);
    setSplash(true);
    window.history.pushState({}, '', '/');
  }

  // Handle browser back/forward
  useEffect(() => {
    function onPop() {
      const m = window.location.pathname.match(/^\/d\/(.+)/);
      if (!m) { setDepartment(null); setSplash(true); }
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <ToastProvider>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      {!department
        ? <DepartmentSelector
            onSelect={enterDept}
            pendingSlug={pendingSlug}
            onSlugResolved={() => setPendingSlug(null)}
          />
        : <CrmShell department={department} onBack={leaveDept} />
      }
      <ToastContainer />
    </ToastProvider>
  );
}
