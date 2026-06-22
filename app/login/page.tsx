'use client';
import { useState } from 'react';

const CLIENT_ID  = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
const TENANT_ID  = process.env.NEXT_PUBLIC_AZURE_TENANT_ID!;
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL!;
const SCOPES     = 'openid profile email User.Read People.Read';
const REDIRECT   = `${APP_URL}/auth/callback`;

function base64url(buf: Uint8Array | ArrayBuffer) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function startPkce() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier  = base64url(verifierBytes);
  const challenge = base64url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  );
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';
  localStorage.setItem('pkce_verifier',      verifier);
  localStorage.setItem('pkce_state',         state);
  localStorage.setItem('pkce_callback_url',  callbackUrl);

  const url = new URL(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`);
  url.searchParams.set('client_id',             CLIENT_ID);
  url.searchParams.set('response_type',         'code');
  url.searchParams.set('redirect_uri',          REDIRECT);
  url.searchParams.set('scope',                 SCOPES);
  url.searchParams.set('code_challenge',        challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state',                 state);
  url.searchParams.set('response_mode',         'query');

  window.location.href = url.toString();
}

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error,  setError]  = useState('');

  async function handleSignIn() {
    setStatus('loading');
    setError('');
    try {
      await startPkce();
    } catch (e: any) {
      setStatus('idle');
      setError(e?.message ?? 'Failed to start sign-in');
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
