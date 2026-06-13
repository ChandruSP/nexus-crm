'use client';
import { Account } from '@/lib/crmTypes';

function fmtCurrency(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const STATUS_COLOR: Record<string, string> = {
  Completed: 'var(--green)',
  Ongoing:   'var(--blue)',
  Cancelled: 'var(--red)',
};

export function OverviewTab({ account }: { account: Account }) {
  const totalRevenue  = account.pastProjects.reduce((s, p) => s + p.revenue, 0);
  const openOpp       = account.opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost');
  const totalPipeline = openOpp.reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const openTasks     = account.tasks.filter(t => t.status !== 'Done').length;
  const critTasks     = account.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Done').length;

  return (
    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

      {/* ── Left: narrative content ──────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Description */}
        {account.description && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              About
            </div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0 }}>
              {account.description}
            </p>
          </div>
        )}

        {/* Past Projects */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Past Projects
          </div>

          {account.pastProjects.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px 0' }}>No past projects recorded.</div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[...account.pastProjects].sort((a, b) => b.year - a.year).map((p, i, arr) => (
              <div key={p.id} style={{ display: 'flex', gap: 0, position: 'relative' }}>
                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[p.status], flexShrink: 0, zIndex: 1 }} />
                  {i < arr.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: 'var(--border2)', marginTop: 4, minHeight: 24 }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 20 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[p.status], background: STATUS_COLOR[p.status] + '18', borderRadius: 99, padding: '1px 6px' }}>
                        {p.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', flexShrink: 0, fontFamily: 'DM Serif Display, serif' }}>
                      {fmtCurrency(p.revenue)}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{p.year}</div>
                  {p.description && <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{p.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: stats + quick facts ───────────────────────────── */}
      <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Stats */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          {[
            { label: 'Total Revenue',     value: fmtCurrency(totalRevenue),  color: 'var(--text)' },
            { label: 'Weighted Pipeline', value: fmtCurrency(totalPipeline), color: 'var(--accent)' },
            { label: 'Open Tasks',        value: openTasks,                  color: openTasks > 0 ? 'var(--amber)' : 'var(--text3)' },
            { label: 'Critical Tasks',    value: critTasks,                  color: critTasks > 0 ? 'var(--red)' : 'var(--text3)' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: 'DM Serif Display, serif', flexShrink: 0 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Quick Facts */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Quick Facts</span>
          </div>
          {[
            { label: 'Industry',  value: account.industry },
            { label: 'Segment',   value: account.segment },
            { label: 'Location',  value: account.location },
            { label: 'Owner',     value: account.owner },
            { label: 'Projects',  value: account.pastProjects.length },
            { label: 'People',    value: account.stakeholders.length },
          ].filter(f => f.value !== '' && f.value !== undefined).map((f, i, arr) => (
            <div key={f.label} style={{
              padding: '9px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{f.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textAlign: 'right' }}>{f.value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
