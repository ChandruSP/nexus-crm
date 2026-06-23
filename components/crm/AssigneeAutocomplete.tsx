'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Person { name: string; email: string }
interface Props { value: string; onChange: (name: string) => void; style?: React.CSSProperties; placeholder?: string; }

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function AssigneeAutocomplete({ value, onChange, style, placeholder }: Props) {
  const [query,   setQuery]   = useState(value);
  const [results, setResults] = useState<Person[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef  = useRef<HTMLDivElement>(null);

  // Keep query in sync with value (e.g. when form resets)
  useEffect(() => { setQuery(value); }, [value]);

  const updatePos = useCallback(() => {
    const el = inputRef.current ?? rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dropH = 220;
    const top = (window.innerHeight - r.bottom) >= dropH ? r.bottom + 4 : r.top - dropH - 4;
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

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!open || !query.trim()) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/ad-users?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }, [query, open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);          // update form immediately on every keystroke
    setOpen(v.length > 0);
  }

  function pickResult(p: Person) {
    setQuery(p.name);
    onChange(p.name);
    setOpen(false);
    setResults([]);
  }

  function handleBlur() {
    // small delay so clicks on portal results register first
    setTimeout(() => setOpen(false), 150);
  }

  const avatarStyle: React.CSSProperties = {
    width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 700, flexShrink: 0,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', fontSize: 13,
    background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-sm)', color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const dropdown = open && dropPos && (results.length > 0 || loading) ? createPortal(
    <div style={{
      position: 'fixed', zIndex: 99999,
      top: dropPos.top, left: dropPos.left, width: dropPos.width,
      background: 'var(--bg2)', border: '1px solid var(--border2)',
      borderRadius: 'var(--r-sm)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      maxHeight: 220, overflowY: 'auto',
    }}>
      {loading && <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>Searching…</div>}
      {results.map(p => (
        <div
          key={p.email || p.name}
          onMouseDown={e => { e.preventDefault(); pickResult(p); }}
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
    <div ref={rootRef} style={{ position: 'relative', ...style }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {query && (
          <div style={{ ...avatarStyle, position: 'absolute', left: 8, pointerEvents: 'none' }}>
            {initials(query)}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder ?? "Search or type a name…"}
          value={query}
          style={{ ...inputStyle, paddingLeft: query ? 38 : 10 }}
          autoComplete="off"
          onChange={handleChange}
          onFocus={() => { setOpen(query.length > 0); updatePos(); }}
          onBlur={handleBlur}
          onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
        />
        {query && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setQuery(''); onChange(''); setOpen(false); }}
            style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: 0 }}
            title="Clear"
          >×</button>
        )}
      </div>
      {dropdown}
    </div>
  );
}
