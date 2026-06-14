'use client';
import { useToast } from '@/context/ToastContext';

const KIND_COLOR: Record<string, string> = {
  success: 'var(--green)',
  error:   'var(--red)',
  info:    'var(--accent)',
};
const KIND_BG: Record<string, string> = {
  success: 'var(--green-dim)',
  error:   'var(--red-dim)',
  info:    'var(--accent-dim)',
};
const KIND_ICON: Record<string, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

export function ToastContainer() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', top: 60, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 'var(--r)',
          background: 'var(--bg2)', border: `1px solid ${KIND_COLOR[t.kind]}40`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
          minWidth: 240, maxWidth: 360,
          animation: 'slideDown 0.2s ease',
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: KIND_BG[t.kind], color: KIND_COLOR[t.kind],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>
            {KIND_ICON[t.kind]}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t.message}</span>
        </div>
      ))}
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
