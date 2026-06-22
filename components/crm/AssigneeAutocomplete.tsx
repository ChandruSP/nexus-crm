'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const debounce  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const updatePos = useCallback(() => {
    const el = inputRef.current ?? container.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dropH = 220;
    const top = (window.innerHeight - r.bottom) >= dropH
      ? r.bottom + 4
      : r.top - dropH - 4;
    setDropPos({ top, left: r.left, width: r.width });
  }, []);

  useEffect(() => {
    if (!open) { setDropPos(null); return; }
    requestAnimationFrame(updatePos);
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && !container.current.contains(e.target as Node)) {
        // also allow clicks inside the portal dropdown
        const portal = document.getElementById('assignee-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  const dropdown = open && dropPos ? createPortal(
    <div
      id="assignee-portal"
      style={{
        position: 'fixed', zIndex: 99999,
        top: dropPos.top, left: dropPos.left, width: dropPos.width,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--r-sm)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        maxHeight: 220, overflowY: 'auto',
      }}
    >
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
    </div>,
    document.body
  ) : null;

  return (
    <div ref={container} style={{ position: 'relative', ...style }}>
      {value && !open && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--r-sm)' }}>
          <div style={avatarStyle}>{initials(value)}</div>
          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: 'var(--text)' }}>{value}</span>
          <button type="button" onClick={clear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
            title="Clear">×</button>
          <button type="button"
            onClick={() => { setQuery(''); setOpen(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: '1px 4px', borderLeft: '1px solid var(--border2)' }}
          >Change</button>
        </div>
      )}

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

      {dropdown}
    </div>
  );
}
