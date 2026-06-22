'use client';
import { useEffect, useState } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '@/lib/msalConfig';

let msalInstance: PublicClientApplication | null = null;
function getMsal() {
  if (!msalInstance) msalInstance = new PublicClientApplication(msalConfig);
  return msalInstance;
}

export default function AuthCallbackPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    async function finish() {
      try {
        const isPopup = !!window.opener;
        const msal = getMsal();
        await msal.initialize();
        const result = await msal.handleRedirectPromise();

        if (isPopup) {
          // MSAL posted the token back to the opener via postMessage; close the popup
          window.close();
          return;
        }

        if (!result) {
          window.location.href = '/login';
          return;
        }

        // Exchange MSAL token for a session cookie via our API
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: result.accessToken,
            name:        result.account?.name  ?? '',
            email:       result.account?.username ?? '',
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? 'Session creation failed');
          return;
        }

        const redirectTo = sessionStorage.getItem('nexus_callback_url') || '/';
        sessionStorage.removeItem('nexus_callback_url');
        window.location.href = redirectTo;
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
