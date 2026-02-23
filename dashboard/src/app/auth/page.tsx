'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthPage() {
  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/';
      }
    });
  }, []);

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
      padding: '16px',
    },
    card: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '48px 32px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center' as const,
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#cbd5e1',
      marginBottom: '32px',
      fontSize: '14px',
    },
    button: {
      width: '100%',
      backgroundColor: '#4285F4',
      color: '#ffffff',
      padding: '12px 16px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s',
    },
    restriction: {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: '#0f172a',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#94a3b8',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mission Control</h1>
        <p style={styles.subtitle}>Marketing Agent Team Orchestrator</p>

        <button
          style={styles.button}
          onClick={handleGoogleSignIn}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#3367D6';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4285F4';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 12a10 10 0 1 0-11.56 9.9" strokeWidth="2" />
          </svg>
          Sign in with Google
        </button>

        <div style={styles.restriction}>
          <strong>Berelvant Organization Only</strong>
          <p style={{ marginTop: '8px' }}>
            Access restricted to @berelvant.com email addresses.
          </p>
        </div>
      </div>
    </div>
  );
}
