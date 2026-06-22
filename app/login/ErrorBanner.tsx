'use client';

const ERROR_MESSAGES: Record<string, string> = {
  MissingCSRF:        'Session expired — please try again.',
  Configuration:      'Server configuration error. Contact your admin.',
  AccessDenied:       'Access denied by your organisation.',
  OAuthSignin:        'Could not start Microsoft sign-in.',
  OAuthCallback:      'Error during Microsoft callback.',
  OAuthCreateAccount: 'Could not create account.',
};

export default function ErrorBanner({ error }: { error: string }) {
  const msg = ERROR_MESSAGES[error] ?? `Sign-in error: ${error}`;
  return (
    <div style={{
      marginTop: 16, padding: '10px 14px',
      background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
      borderRadius: 8, fontSize: 12, color: '#fca5a5', textAlign: 'left',
    }}>
      {msg}
    </div>
  );
}
