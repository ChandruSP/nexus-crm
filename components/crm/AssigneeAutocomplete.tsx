'use client';
import { useState, useEffect, useRef } from 'react';

interface Person { name: string; email: string }

interface Props {
  value: string;
  onChange: (name: string) => void;
  style?: React.CSSProperties;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function AssigneeAutocomplete({ value, onChange, style }: Props) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!open) return;
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ad-users?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
  }, [query, open]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && !container.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function openPicker() {
    setQuery('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(p: Person) {
    onChange(p.name);
    setQuery('');
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  }

  const wrapBase: React.CSSProperties = {
    position: 'relative',
    minHeight: 34,
    ...style,
  };

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '4px 10px 4px 6px',
    background: 'var(--bg4)', border: '1px solid var(--border2)',
    borderRadius: 99, cursor: 'default', userSelect: 'none',
    fontSize: 13, color: 'var(--text)',
  };

  const avatarStyle: React.CSSProperties = {
    width: 22, height: 22, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 700, flexShrink: 0,
  };

  const removeBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--text3)', padding: 0, lineHeight: 1,
    fontSize: 15, display: 'flex', alignItems: 'center',
    borderRadius: '50',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  };

  const placeholderBox: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text3)',
    cursor: 'text', boxSizing: 'border-box',
  };

  return (
    <div ref={container} style={wrapBase}>
      {value && !open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={chipStyle}>
            <div style={avatarStyle}>{initials(value)}</div>
            <span style={{ fontWeight: 600 }}>{value}</span>
            <button style={removeBtn} onMouseDown={clear} title="Remove assignee">×</button>
          </div>
          <button
            onMouseDown={openPicker}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: '2px 4px' }}
          >
            Change
          </button>
        </div>
      ) : open ? (
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name…"
          value={query}
          style={inputStyle}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); } }}
        />
      ) : (
        <div style={placeholderBox} onMouseDown={openPicker}>
          Search and assign…
        </div>
      )}

      {open && (
        <div style={{
          position: 'absolute', zIndex: 999, top: '100%', left: 0, right: 0,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--r-sm)', marginTop: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>
              {query ? 'No results' : 'Type to search your directory…'}
            </div>
          )}
          {!loading && results.map(p => (
            <div
              key={p.email || p.name}
              onMouseDown={() => select(p)}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg4)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ ...avatarStyle, width: 28, height: 28, fontSize: 10, flexShrink: 0 }}>
                {initials(p.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{p.name}</div>
                {p.email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
