'use client';
import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    async function finish() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code     = params.get('code');
        const state    = params.get('state');
        const errParam = params.get('error');
        const errDesc  = params.get('error_description');

        if (errParam) { setError(`${errParam}: ${errDesc}`); return; }
        if (!code)    { window.location.href = '/login'; return; }

        const verifier      = localStorage.getItem('pkce_verifier');
        const savedState    = localStorage.getItem('pkce_state');
        const callbackUrl   = localStorage.getItem('pkce_callback_url') || '/';
        localStorage.removeItem('pkce_verifier');
        localStorage.removeItem('pkce_state');
        localStorage.removeItem('pkce_callback_url');

        if (state !== savedState) { setError('State mismatch — possible CSRF. Please try again.'); return; }
        if (!verifier)            { setError('PKCE verifier missing. Please try again.'); return; }

        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, verifier }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? 'Session creation failed');
          return;
        }

        window.location.href = callbackUrl;
      } catch (e: any) {
        setError(e?.message ?? 'Unknown error during sign-in');
      }
    }
    finish();
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      fontFamily: 'Instrument Sans, system-ui, sans-serif', color: '#fff', textAlign: 'center',
    }}>
      {error ? (
        <div style={{ padding: 32, maxWidth: 360 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#fca5a5' }}>Sign-in failed</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>{error}</div>
          <a href="/login" style={{ color: '#a5b4fc', fontSize: 13 }}>← Back to login</a>
        </div>
      ) : (
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Completing sign-in…</div>
      )}
    </div>
  );
}
