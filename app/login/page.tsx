'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const ERROR_MESSAGES: Record<string, string> = {
  MissingCSRF:        'Session expired — please try again.',
  Configuration:      'Server configuration error. Contact your admin.',
  AccessDenied:       'Access denied by your organisation.',
  OAuthSignin:        'Could not start Microsoft sign-in.',
  OAuthCallback:      'Error during Microsoft callback.',
  OAuthCreateAccount: 'Could not create account.',
};

function LoginCard() {
  const params   = useSearchParams();
  const urlError = params.get('error');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSignIn() {
    setLoading(true);
    setError('');
    try {
      // Fetch CSRF token (with its cookie)
      const res = await fetch('/api/auth/csrf');
      const { csrfToken } = await res.json();

      // Submit a real form POST — browser follows the 302 to Microsoft natively,
      // no CORS or window.location issues possible.
      const form = document.createElement('form');
      form.method  = 'POST';
      form.action  = '/api/auth/signin/microsoft-entra-id';

      for (const [name, value] of [
        ['csrfToken',   csrfToken],
        ['callbackUrl', '/'],
      ] as [string, string][]) {
        const input = document.createElement('input');
        input.type  = 'hidden';
        input.name  = name;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit(); // browser takes over here
    } catch (e: any) {
      setLoading(false);
      setError(e?.message ?? 'Unexpected error — please try again.');
    }
  }

  const errorMsg = error || (urlError ? (ERROR_MESSAGES[urlError] ?? `Error: ${urlError}`) : '');

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 24, padding: '48px 40px', width: 360, maxWidth: '92vw',
      boxShadow: '0 32px 80px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#a5b4fc', letterSpacing: '0.12em', fontFamily: 'Poppins, sans-serif', marginBottom: 8 }}>
        NEXUS
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 40 }}>
        Account Management Platform
      </div>

      <button
        onClick={handleSignIn}
        disabled={loading}
        style={{
          width: '100%', padding: '14px 20px', borderRadius: 12,
          background: loading ? '#1d4ed8' : '#2563eb',
          color: '#fff', border: 'none',
          fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          boxSizing: 'border-box', opacity: loading ? 0.8 : 1,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>
        {loading ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}
      </button>

      {errorMsg && (
        <div style={{
          marginTop: 16, padding: '10px 14px',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 8, fontSize: 12, color: '#fca5a5', textAlign: 'left',
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
        Access restricted to authorised organisation members
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      fontFamily: 'Instrument Sans, system-ui, sans-serif',
    }}>
      <Suspense fallback={null}>
        <LoginCard />
      </Suspense>
    </div>
  );
}
