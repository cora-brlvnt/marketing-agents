'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthCallback() {
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const currentUrl = window.location.href;
        const hash = window.location.hash;
        const searchParams = new URL(currentUrl).searchParams;

        console.log('[Auth Callback] URL:', currentUrl);
        console.log('[Auth Callback] Hash present:', !!hash && hash.length > 1);
        console.log('[Auth Callback] Code present:', !!searchParams.get('code'));

        // Method 1: Hash fragment (implicit flow)
        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[Auth Callback] Setting session from hash tokens');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('[Auth Callback] setSession error:', error);
              setStatus('Auth error: ' + error.message);
              setTimeout(() => { window.location.href = '/auth?error=session'; }, 2000);
              return;
            }

            if (data.session?.user?.email) {
              return handleUser(data.session.user.email);
            }
          }
        }

        // Method 2: PKCE code exchange
        const code = searchParams.get('code');
        if (code) {
          console.log('[Auth Callback] Exchanging code for session');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[Auth Callback] Code exchange error:', error);
            setStatus('Auth error: ' + error.message);
            setTimeout(() => { window.location.href = '/auth?error=exchange'; }, 2000);
            return;
          }

          if (data.session?.user?.email) {
            return handleUser(data.session.user.email);
          }
        }

        // Method 3: Check if session already exists (e.g., auto-detected)
        console.log('[Auth Callback] Checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          return handleUser(session.user.email);
        }

        // Method 4: Wait for auth state change
        console.log('[Auth Callback] Waiting for auth state change...');
        setStatus('Completing authentication...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[Auth Callback] Auth event:', event);
            if (event === 'SIGNED_IN' && session?.user?.email) {
              subscription.unsubscribe();
              return handleUser(session.user.email);
            }
          }
        );

        // Timeout after 8 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          console.error('[Auth Callback] Timeout - no session established');
          setStatus('Authentication timed out. Redirecting...');
          setTimeout(() => { window.location.href = '/auth?error=timeout'; }, 1000);
        }, 8000);

      } catch (error) {
        console.error('[Auth Callback] Unexpected error:', error);
        setStatus('Unexpected error. Redirecting...');
        setTimeout(() => { window.location.href = '/auth?error=unknown'; }, 2000);
      }
    };

    const handleUser = (email: string) => {
      console.log('[Auth Callback] User email:', email);
      if (!email.endsWith('@berelvant.com')) {
        console.log('[Auth Callback] Domain rejected:', email);
        setStatus('Access denied. Only @berelvant.com emails allowed.');
        supabase.auth.signOut();
        setTimeout(() => { window.location.href = '/auth?error=domain'; }, 2000);
        return;
      }
      console.log('[Auth Callback] Success! Redirecting to dashboard...');
      setStatus('Welcome! Redirecting...');
      window.location.href = '/';
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#ffffff',
      gap: '16px',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #334155',
        borderTop: '3px solid #4285F4',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
