'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase OAuth returns tokens in the URL hash fragment.
        // We need to detect the hash and let the Supabase client
        // exchange it for a session via onAuthStateChange.
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          // Hash-based implicit flow: Supabase JS client auto-detects
          // hash fragments on init — but only if detectSessionInUrl is true
          // (default). Give it a moment to process.
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user?.email) {
            if (!session.user.email.endsWith('@berelvant.com')) {
              await supabase.auth.signOut();
              window.location.href = '/auth?error=domain';
              return;
            }
            window.location.href = '/';
            return;
          }
        }

        // PKCE flow: look for ?code= in the URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            window.location.href = '/auth?error=exchange';
            return;
          }
          if (data.session?.user?.email) {
            if (!data.session.user.email.endsWith('@berelvant.com')) {
              await supabase.auth.signOut();
              window.location.href = '/auth?error=domain';
              return;
            }
            window.location.href = '/';
            return;
          }
        }

        // Listen for auth state change (fallback — Supabase may
        // process hash asynchronously)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user?.email) {
              if (!session.user.email.endsWith('@berelvant.com')) {
                await supabase.auth.signOut();
                window.location.href = '/auth?error=domain';
                return;
              }
              window.location.href = '/';
            }
          }
        );

        // Timeout: if nothing happens in 5s, redirect to auth
        setTimeout(() => {
          subscription.unsubscribe();
          window.location.href = '/auth';
        }, 5000);
      } catch (error) {
        console.error('Callback error:', error);
        window.location.href = '/auth';
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#ffffff',
    }}>
      <p>Authenticating...</p>
    </div>
  );
}
