'use client';
import { useEffect, useState } from 'react';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('out'), 2400);
    const t3 = setTimeout(() => onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a2a1e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'out' ? 0 : 1,
      transition: phase === 'out' ? 'opacity 0.6s ease' : phase === 'in' ? 'opacity 0.4s ease' : 'none',
    }}>
      {/* Glow rings */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(13,148,136,0.15)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: '1px solid rgba(13,148,136,0.25)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', border: '1px solid rgba(13,148,136,0.4)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

      {/* Logo mark */}
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, #0d9488, #0f766e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 0 40px rgba(13,148,136,0.5), 0 0 80px rgba(13,148,136,0.2)',
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'scale(0.8)' : 'scale(1)',
        transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M6 18L12 8L18 16L24 6L30 18" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 26L12 20L18 24L24 18L30 26" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        </svg>
      </div>

      {/* Wordmark */}
      <div style={{
        opacity: phase === 'in' ? 0 : 1,
        transform: phase === 'in' ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.5s ease 0.35s, transform 0.5s ease 0.35s',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: '#ffffff', letterSpacing: '0.18em', fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>
          NEXUS
        </div>
        <div style={{ fontSize: 12, color: 'rgba(13,148,136,0.9)', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 500, marginTop: 8, fontFamily: 'Poppins, sans-serif' }}>
          Account Intelligence
        </div>
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: 'absolute', bottom: 40,
        fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em',
        fontFamily: 'Poppins, sans-serif',
        opacity: phase === 'in' ? 0 : 1,
        transition: 'opacity 0.5s ease 0.6s',
      }}>
        Sales & Key Account Management
      </div>
    </div>
  );
}
