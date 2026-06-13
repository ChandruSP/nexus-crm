'use client';
import { useState } from 'react';
import { useConfig, ConfigState } from '@/context/ConfigContext';

const SECTIONS: { key: keyof ConfigState; label: string; desc: string }[] = [
  { key: 'industries',  label: 'Industries',        desc: 'Available industry options for accounts.' },
  { key: 'teamMembers', label: 'Team Members',       desc: 'People that can be assigned to tasks.' },
  { key: 'oppStages',   label: 'Opportunity Stages', desc: 'Pipeline stages for opportunities (order matters).' },
];

function PicklistSection({ sectionKey, label, desc }: { sectionKey: keyof ConfigState; label: string; desc: string }) {
  const { config, dispatch } = useConfig();
  const [input, setInput]   = useState('');
  const items = config[sectionKey];

  function add() {
    if (!input.trim()) return;
    dispatch({ type: 'ADD_ITEM', list: sectionKey, value: input.trim() });
    setInput('');
  }

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{desc}</div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
        {items.map((item, i) => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {sectionKey === 'oppStages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button disabled={i === 0} onClick={() => dispatch({ type: 'MOVE_ITEM', list: sectionKey, from: i, to: i - 1 })}
                    style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: 'var(--text3)', fontSize: 10, padding: 0, opacity: i === 0 ? 0.3 : 1, lineHeight: 1 }}>▲</button>
                  <button disabled={i === items.length - 1} onClick={() => dispatch({ type: 'MOVE_ITEM', list: sectionKey, from: i, to: i + 1 })}
                    style={{ background: 'none', border: 'none', cursor: i === items.length - 1 ? 'default' : 'pointer', color: 'var(--text3)', fontSize: 10, padding: 0, opacity: i === items.length - 1 ? 0.3 : 1, lineHeight: 1 }}>▼</button>
                </div>
              )}
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{item}</span>
            </div>
            <button onClick={() => dispatch({ type: 'REMOVE_ITEM', list: sectionKey, value: item })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
              title={`Remove ${item}`}>
              ×
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ padding: '16px 14px', fontSize: 12, color: 'var(--text3)' }}>No items yet.</div>
        )}
      </div>

      {/* Add row */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder={`Add ${label.toLowerCase().replace(/s$/, '')}…`}
          style={{ flex: 1, padding: '8px 11px', fontSize: 12, borderRadius: 'var(--r-sm)', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', outline: 'none' }}
        />
        <button onClick={add} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)' }}>
          Add
        </button>
      </div>
    </div>
  );
}

export function ConfigView() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px 18px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Settings</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text)', fontFamily: 'DM Serif Display, serif' }}>Configure Picklists</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text3)' }}>Manage the dropdown options available across the app.</p>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 640 }}>
        {SECTIONS.map(s => (
          <PicklistSection key={s.key} sectionKey={s.key} label={s.label} desc={s.desc} />
        ))}
      </div>
    </div>
  );
}
