'use client';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
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
          onClick={() => signIn('microsoft-entra-id', { callbackUrl: '/' })}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 12,
            background: '#2563eb', color: '#fff', border: 'none',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}
        >
          {/* Microsoft logo */}
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Sign in with Microsoft
        </button>

        <div style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          Access restricted to authorised organisation members
        </div>
      </div>
    </div>
  );
}
