'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface Person { name: string; email: string }
interface Props { value: string; onChange: (name: string) => void; style?: React.CSSProperties; }

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function AssigneeAutocomplete({ value, onChange, style }: Props) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const updatePos = useCallback(() => {
    const el = inputRef.current ?? container.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dropHeight = 220;
    const spaceBelow = window.innerHeight - r.bottom;
    const top = spaceBelow < dropHeight && r.top > dropHeight
      ? r.top - dropHeight - 4   // flip above
      : r.bottom + 4;            // below (default)
    setDropPos({ top, left: r.left, width: r.width });
  }, []);

  // Recalculate dropdown position whenever it opens
  useEffect(() => {
    if (open) {
      // Use rAF to let DOM settle after open state change
      requestAnimationFrame(updatePos);
    }
  }, [open, updatePos]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && !container.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch results when query changes
  useEffect(() => {
    if (!open) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/ad-users?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
      setLoading(false);
    }, 250);
  }, [query, open]);

  function select(p: Person) {
    onChange(p.name);
    setQuery('');
    setOpen(false);
  }

  function clear() {
    onChange('');
    setQuery('');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const avatarStyle: React.CSSProperties = {
    width: 22, height: 22, borderRadius: '50%',
    background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 700, flexShrink: 0,
  };

  return (
    <div ref={container} style={{ position: 'relative', ...style }}>

      {/* Selected pill */}
      {value && !open && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)', cursor: 'default' }}>
          <div style={avatarStyle}>{initials(value)}</div>
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--text)' }}>{value}</span>
          <button
            type="button"
            onClick={clear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
            title="Clear"
          >×</button>
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(true); requestAnimationFrame(updatePos); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: '1px 4px', borderLeft: '1px solid var(--border2)' }}
          >Change</button>
        </div>
      )}

      {/* Search input — always rendered when no value or open */}
      {(!value || open) && (
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name…"
          value={query}
          style={inputStyle}
          autoComplete="off"
          onChange={e => { setQuery(e.target.value); setOpen(true); updatePos(); }}
          onFocus={() => { setOpen(true); updatePos(); }}
          onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        />
      )}

      {/* Dropdown — fixed position so it escapes overflow:auto parents */}
      {open && (
        <div style={{
          position: 'fixed', zIndex: 9999,
          top: dropPos.top, left: dropPos.left, width: dropPos.width,
          background: 'var(--bg2)', border: '1px solid var(--border2)',
          borderRadius: 'var(--r-sm)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {loading && <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>Searching…</div>}
          {!loading && results.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>
              {query ? 'No results' : 'Type a name to search…'}
            </div>
          )}
          {results.map(p => (
            <div
              key={p.email || p.name}
              onMouseDown={() => select(p)}
              style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg4)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ ...avatarStyle, width: 28, height: 28, fontSize: 10 }}>{initials(p.name)}</div>
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
