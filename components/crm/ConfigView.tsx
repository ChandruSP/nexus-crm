'use client';
import { useState } from 'react';
import { useConfig, ConfigState } from '@/context/ConfigContext';

const SECTIONS: { key: keyof ConfigState; label: string; icon: string; desc: string }[] = [
  { key: 'industries',  label: 'Industries',        icon: '🏭', desc: 'Available industry options when creating or editing accounts.' },
  { key: 'teamMembers', label: 'Team Members',       icon: '👤', desc: 'People that can be assigned to tasks and opportunities.' },
  { key: 'oppStages',   label: 'Opportunity Stages', icon: '📊', desc: 'Pipeline stages for opportunities. Order here controls the kanban column order.' },
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <button disabled={i === 0} onClick={() => dispatch({ type: 'MOVE_ITEM', list: sectionKey, from: i, to: i - 1 })}
                    style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: 'var(--text3)', fontSize: 9, padding: 0, opacity: i === 0 ? 0.3 : 1, lineHeight: 1 }}>▲</button>
                  <button disabled={i === items.length - 1} onClick={() => dispatch({ type: 'MOVE_ITEM', list: sectionKey, from: i, to: i + 1 })}
                    style={{ background: 'none', border: 'none', cursor: i === items.length - 1 ? 'default' : 'pointer', color: 'var(--text3)', fontSize: 9, padding: 0, opacity: i === items.length - 1 ? 0.3 : 1, lineHeight: 1 }}>▼</button>
                </div>
              )}
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
            </div>
            <button onClick={() => requestDelete(item)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: '0 4px', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              title={`Remove ${item}`}>
              ×
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
              }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              {section.icon} {section.label}
            </div>
          </div>
          <PicklistSection key={section.key} sectionKey={section.key} desc={section.desc} />
        </div>
      </div>
    </div>
  );
}
