'use client';
import { useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginScopes } from '@/lib/msalConfig';

let msalInstance: PublicClientApplication | null = null;
async function getMsal() {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  return msalInstance;
}

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error,  setError]  = useState('');

  async function handleSignIn() {
    setStatus('loading');
    setError('');
    try {
      const msal = await getMsal();
      // Clear any stale interaction state left by previous loginRedirect attempts
      await msal.handleRedirectPromise().catch(() => {});
      const result = await msal.loginPopup({
        scopes: loginScopes,
        redirectUri: window.location.origin + '/auth/popup',
      });

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: result.accessToken,
          name:        result.account?.name     ?? '',
          email:       result.account?.username ?? '',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Session creation failed');
      }

      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('callbackUrl') || '/';
    } catch (e: any) {
      setStatus('idle');
      setError(e?.message ?? 'Failed to sign in');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      fontFamily: 'Instrument Sans, system-ui, sans-serif',
    }}>
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
          disabled={status === 'loading'}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 12,
            background: status === 'loading' ? '#1d4ed8' : '#2563eb',
            color: '#fff', border: 'none', fontWeight: 700, fontSize: 14,
            cursor: status === 'loading' ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxSizing: 'border-box', opacity: status === 'loading' ? 0.8 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1"  width="9" height="9" fill="#7fba00"/>
            <rect x="1"  y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          {status === 'loading' ? 'Redirecting to Microsoft…' : 'Sign in with Microsoft'}
        </button>

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 8, fontSize: 12, color: '#fca5a5', textAlign: 'left',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Access restricted to authorised organisation members
        </div>
      </div>
    </div>
  );
}
