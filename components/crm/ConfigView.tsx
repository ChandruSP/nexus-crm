'use client';
import { useState } from 'react';
import { useConfig, ConfigState } from '@/context/ConfigContext';

const IndustriesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="9" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="6" y="5" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="11" y="2" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);

const TeamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M1.5 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="11.5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M13.5 13.5c0-1.933-1.12-3.6-2.75-4.34" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const StagesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1.5 8h13M8 1.5l6.5 6.5-6.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SECTIONS: { key: keyof ConfigState; label: string; Icon: React.FC; desc: string }[] = [
  { key: 'industries',  label: 'Industries',        Icon: IndustriesIcon, desc: 'Available industry options when creating or editing accounts.' },
  { key: 'teamMembers', label: 'Team Members',       Icon: TeamIcon,       desc: 'People that can be assigned to tasks and opportunities.' },
  { key: 'oppStages',   label: 'Opportunity Stages', Icon: StagesIcon,     desc: 'Pipeline stages for opportunities. Order here controls the kanban column order.' },
];

interface ConfirmState { item: string; list: keyof ConfigState }

function PicklistSection({ sectionKey, desc }: { sectionKey: keyof ConfigState; desc: string }) {
  const { config, dispatch } = useConfig();
  const [input, setInput]   = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const items = config[sectionKey];

  function add() {
    if (!input.trim()) return;
    dispatch({ type: 'ADD_ITEM', list: sectionKey, value: input.trim() });
    setInput('');
  }

  function requestDelete(item: string) {
    setConfirm({ item, list: sectionKey });
  }

  function confirmDelete() {
    if (!confirm) return;
    dispatch({ type: 'REMOVE_ITEM', list: confirm.list, value: confirm.item });
    setConfirm(null);
  }

  const inputStyle = {
    flex: 1, padding: '8px 11px', fontSize: 13, borderRadius: 'var(--r-sm)',
    background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none',
  };

  return (
    <div style={{ flex: 1 }}>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text2)' }}>{desc}</p>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 12 }}>
        {items.map((item, i) => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            background: 'var(--bg2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {sectionKey === 'oppStages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button disabled={i === 0} onClick={() => dispatch({ type: 'MOVE_ITEM', list: sectionKey, from: i, to: i - 1 })}
                    style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: 'var(--text3)', padding: 0, opacity: i === 0 ? 0.25 : 1, lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.12s' }}
                    onMouseEnter={e => { if (i !== 0) (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button disabled={i === items.length - 1} onClick={() => dispatch({ type: 'MOVE_ITEM', list: sectionKey, from: i, to: i + 1 })}
                    style={{ background: 'none', border: 'none', cursor: i === items.length - 1 ? 'default' : 'pointer', color: 'var(--text3)', padding: 0, opacity: i === items.length - 1 ? 0.25 : 1, lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.12s' }}
                    onMouseEnter={e => { if (i !== items.length - 1) (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              )}
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
            </div>
            <button onClick={() => requestDelete(item)}
              title={`Remove ${item}`}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--r-xs)', cursor: 'pointer', color: 'var(--text3)', flexShrink: 0, transition: 'color 0.12s, border-color 0.12s, background 0.12s' }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.color = 'var(--red)'; b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-dim)'; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.color = 'var(--text3)'; b.style.borderColor = 'var(--border2)'; b.style.background = 'transparent'; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M6 4V2.5h2V4M5 4v8h4V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ padding: '20px 14px', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>No items yet.</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Type and press Enter or Add…"
          style={inputStyle}
        />
        <button onClick={add} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', flexShrink: 0 }}>
          Add
        </button>
      </div>

      {/* Delete confirmation modal */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }} onClick={() => setConfirm(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg2)', borderRadius: 'var(--r)', border: '1px solid var(--border2)',
              padding: '24px 28px', width: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Remove item?</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              <strong style={{ color: 'var(--text)' }}>"{confirm.item}"</strong> will be removed from this list. This won't affect existing records that already use it.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)} style={{ padding: '7px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>
                Cancel
              </button>
              <button onClick={confirmDelete} style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConfigView() {
  const [activeSection, setActiveSection] = useState<keyof ConfigState>('industries');
  const section = SECTIONS.find(s => s.key === activeSection)!;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Settings</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Configure Picklists</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text3)' }}>Manage the dropdown options available across the app.</p>
      </div>

      {/* Two-column body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left nav */}
        <div style={{ width: 220, borderRight: '1px solid var(--border)', background: 'var(--bg2)', flexShrink: 0, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SECTIONS.map(s => {
            const active = s.key === activeSection;
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '10px 12px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text2)',
                fontWeight: active ? 600 : 400, fontSize: 13,
                transition: 'background 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <s.Icon />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--accent)' }}><section.Icon /></span>
              {section.label}
            </div>
          </div>
          <PicklistSection key={section.key} sectionKey={section.key} desc={section.desc} />
        </div>
      </div>
    </div>
  );
}
