'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function handleSignIn() {
    setStatus('loading');
    setErrMsg('');
    try {
      await signIn('microsoft-entra-id', { callbackUrl: '/' });
    } catch (e: any) {
      setStatus('error');
      setErrMsg(e?.message ?? String(e));
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
            color: '#fff', border: 'none',
            fontWeight: 700, fontSize: 14, cursor: status === 'loading' ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxSizing: 'border-box', opacity: status === 'loading' ? 0.8 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          {status === 'loading' ? 'Redirecting…' : 'Sign in with Microsoft'}
        </button>

        {status === 'error' && (
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, fontSize: 12, color: '#fca5a5', textAlign: 'left', wordBreak: 'break-all' }}>
            {errMsg || 'An unknown error occurred. Check the browser console for details.'}
          </div>
        )}

        <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Access restricted to authorised organisation members
        </div>
      </div>
    </div>
  );
}
