'use client';
import { useEffect, useState, useMemo } from 'react';

interface MyTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  description: string;
  accountId: string;
  accountName: string;
  departmentId: string;
  departmentName: string;
  departmentIcon: string;
  departmentColor: string;
}

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low'];
const STATUS_COLORS: Record<string, string> = {
  'To do':      'var(--text3)',
  'In progress':'#3b82f6',
  'Done':       '#22c55e',
  'Blocked':    '#ef4444',
};
const PRIORITY_COLORS: Record<string, string> = {
  'Critical': '#ef4444',
  'High':     '#f97316',
  'Medium':   '#eab308',
  'Low':      '#6b7280',
};

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'Done') return false;
  return new Date(dueDate) < new Date(new Date().setHours(0,0,0,0));
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyTasksPage() {
  const [tasks,       setTasks]       = useState<MyTask[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [fDept,       setFDept]       = useState('');
  const [fStatus,     setFStatus]     = useState('');
  const [fPriority,   setFPriority]   = useState('');
  const [fDue,        setFDue]        = useState('');
  const [search,      setSearch]      = useState('');
  const [userName,    setUserName]    = useState('');

  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(d => setUserName(d.user?.name ?? ''));
    fetch('/api/my-tasks')
      .then(r => r.json())
      .then(d => { setTasks(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setError('Failed to load tasks'); setLoading(false); });
  }, []);

  const departments = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string; color: string }>();
    tasks.forEach(t => {
      if (t.departmentId) map.set(t.departmentId, { id: t.departmentId, name: t.departmentName, icon: t.departmentIcon, color: t.departmentColor });
    });
    return [...map.values()];
  }, [tasks]);

  const filtered = useMemo(() => tasks.filter(t => {
    if (fDept     && t.departmentId !== fDept)                         return false;
    if (fStatus   && t.status       !== fStatus)                       return false;
    if (fPriority && t.priority     !== fPriority)                     return false;
    if (fDue === 'overdue' && !isOverdue(t.dueDate, t.status))        return false;
    if (fDue === 'week') {
      const today = new Date(); today.setHours(0,0,0,0);
      const end   = new Date(today); end.setDate(today.getDate() + 7);
      if (!t.dueDate || t.status === 'Done') return false;
      const d = new Date(t.dueDate);
      if (d < today || d > end) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.accountName.toLowerCase().includes(q) || t.departmentName.toLowerCase().includes(q);
    }
    return true;
  }), [tasks, fDept, fStatus, fPriority, fDue, search]);

  // Group by department
  const grouped = useMemo(() => {
    const map = new Map<string, { dept: MyTask['departmentName']; icon: string; color: string; tasks: MyTask[] }>();
    filtered.forEach(t => {
      const key = t.departmentId || '__none';
      if (!map.has(key)) map.set(key, { dept: t.departmentName, icon: t.departmentIcon, color: t.departmentColor, tasks: [] });
      map.get(key)!.tasks.push(t);
    });
    return [...map.entries()];
  }, [filtered]);

  const counts = useMemo(() => ({
    total:      filtered.length,
    done:       filtered.filter(t => t.status === 'Done').length,
    overdue:    filtered.filter(t => isOverdue(t.dueDate, t.status)).length,
    inProgress: filtered.filter(t => t.status === 'In progress').length,
  }), [filtered]);

  const sel: React.CSSProperties = {
    padding: '6px 10px', fontSize: 12, fontWeight: 500,
    background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text2)', cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Instrument Sans, sans-serif', color: 'var(--text)' }}>

      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '0 28px', height: 52, display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12, textDecoration: 'none', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', padding: '4px 10px' }}>
          ← Home
        </a>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', fontFamily: 'Poppins, sans-serif' }}>NEXUS</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>My Tasks</span>
        {userName && <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 2 }}>— {userName}</span>}
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Stats strip */}
        {!loading && !error && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total',       value: counts.total,      color: 'var(--accent)' },
              { label: 'In Progress', value: counts.inProgress, color: '#3b82f6' },
              { label: 'Overdue',     value: counts.overdue,    color: '#ef4444' },
              { label: 'Done',        value: counts.done,       color: '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ flex: '1 1 120px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...sel, width: 180, cursor: 'text' }} />
          <select style={sel} value={fDept} onChange={e => setFDept(e.target.value)}>
            <option value="">All departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
          </select>
          <select style={sel} value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['To do', 'In progress', 'Blocked', 'Done'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select style={sel} value={fPriority} onChange={e => setFPriority(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITY_ORDER.map(p => <option key={p}>{p}</option>)}
          </select>
          <select style={sel} value={fDue} onChange={e => setFDue(e.target.value)}>
            <option value="">All due dates</option>
            <option value="overdue">Overdue</option>
            <option value="week">Due this week</option>
          </select>
          {(fDept || fStatus || fPriority || fDue || search) && (
            <button onClick={() => { setFDept(''); setFStatus(''); setFPriority(''); setFDue(''); setSearch(''); }}
              style={{ ...sel, color: 'var(--accent)', borderColor: 'var(--accent)', cursor: 'pointer' }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {loading && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading your tasks…</div>}
        {error   && <div style={{ color: '#ef4444', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>No tasks found</div>
        )}

        {!loading && !error && grouped.map(([key, group]) => (
          <div key={key} style={{ marginBottom: 32 }}>
            {/* Dept header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: group.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{group.icon} {group.dept}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Task rows */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              {group.tasks.map((t, i) => {
                const overdue = isOverdue(t.dueDate, t.status);
                return (
                  <div key={t.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto auto auto',
                    alignItems: 'center', gap: 16,
                    padding: '11px 16px',
                    background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)',
                    borderBottom: i < group.tasks.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    {/* Title + account */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                      {t.accountName && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.accountName}</div>}
                    </div>
                    {/* Priority */}
                    <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLORS[t.priority] ?? 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {t.priority}
                    </span>
                    {/* Status */}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                      background: `${STATUS_COLORS[t.status] ?? 'var(--text3)'}20`,
                      color: STATUS_COLORS[t.status] ?? 'var(--text3)', whiteSpace: 'nowrap',
                    }}>
                      {t.status}
                    </span>
                    {/* Due date */}
                    <span style={{ fontSize: 11, color: overdue ? '#ef4444' : 'var(--text3)', fontWeight: overdue ? 700 : 400, whiteSpace: 'nowrap' }}>
                      {overdue ? '⚠ ' : ''}{formatDate(t.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
