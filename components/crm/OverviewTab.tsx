'use client';
import { Account } from '@/lib/crmTypes';

function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const STATUS_COLOR: Record<string, string> = {
  Completed: 'var(--green)',
  Ongoing: 'var(--blue)',
  Cancelled: 'var(--red)',
};

export function OverviewTab({ account }: { account: Account }) {
  const totalRevenue = account.pastProjects.reduce((s, p) => s + p.revenue, 0);
  const openOpp = account.opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost');
  const totalPipeline = openOpp.reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const openTasks = account.tasks.filter(t => t.status !== 'Done').length;
  const critTasks = account.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;

  const statCards = [
    { label: 'Total Revenue', value: fmtCurrency(totalRevenue), color: 'var(--green)' },
    { label: 'Weighted Pipeline', value: fmtCurrency(totalPipeline), color: 'var(--accent)' },
    { label: 'Open Tasks', value: openTasks, color: openTasks > 0 ? 'var(--amber)' : 'var(--text3)' },
    { label: 'Critical Tasks', value: critTasks, color: critTasks > 0 ? 'var(--red)' : 'var(--text3)' },
  ];

  return (
    <div>
      {/* stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ padding: '14px 16px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'DM Serif Display, serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* description */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Account Overview
        </div>
        <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
          {account.description}
        </div>
      </div>

      {/* account meta */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { label: 'Industry', value: account.industry },
          { label: 'Segment', value: account.segment },
          { label: 'Location', value: account.location },
          { label: 'Account Owner', value: account.owner },
          { label: 'Projects', value: account.pastProjects.length },
          { label: 'Stakeholders', value: account.stakeholders.length },
        ].filter(m => m.value).map(m => (
          <div key={m.label}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* past projects */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Past Projects
        </div>
        {account.pastProjects.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>No past projects recorded.</div>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {account.pastProjects.map(p => (
            <div key={p.id} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '12px 16px', background: 'var(--bg3)',
              borderRadius: 'var(--r)', border: '1px solid var(--border)',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--text3)' }}>
                {p.year}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[p.status], background: STATUS_COLOR[p.status] + '1a', borderRadius: 99, padding: '1px 6px' }}>
                    {p.status}
                  </span>
                </div>
                {p.description && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{p.description}</div>}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', flexShrink: 0, fontFamily: 'DM Serif Display, serif' }}>
                {fmtCurrency(p.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
