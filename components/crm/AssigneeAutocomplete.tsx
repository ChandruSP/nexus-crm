'use client';
import { useState, useEffect, useRef } from 'react';

interface Person { name: string; email: string }

interface Props {
  value: string;
  onChange: (name: string) => void;
  style?: React.CSSProperties;
}

export function AssigneeAutocomplete({ value, onChange, style }: Props) {
  const [query, setQuery]       = useState(value);
  const [results, setResults]   = useState<Person[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const container = useRef<HTMLDivElement>(null);

  // Keep query in sync when value changes externally
  useEffect(() => { setQuery(value); }, [value]);

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

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && !container.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const base: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div ref={container} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        placeholder="Search name…"
        value={query}
        style={base}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <div style={{
          position: 'absolute', zIndex: 999, top: '100%', left: 0, right: 0,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--r-sm)', marginTop: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>No results</div>
          )}
          {!loading && results.map(p => (
            <div
              key={p.email || p.name}
              onMouseDown={() => { onChange(p.name); setQuery(p.name); setOpen(false); }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg4)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
              {p.email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.email}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
