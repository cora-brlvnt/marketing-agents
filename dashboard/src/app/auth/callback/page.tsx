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
        // Supabase will set session automatically via callback
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email) {
          // Check if email is @berelvant.com
          if (!session.user.email.endsWith('@berelvant.com')) {
            await supabase.auth.signOut();
            window.location.href = '/auth?error=domain';
            return;
          }

          // Check if user is authorized
          const { data: authUser } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (!authUser) {
            // First-time user, add to authorized_users
            await supabase.from('authorized_users').insert({
              email: session.user.email,
              authorized: false,
              created_at: new Date(),
            });
          }

          // Redirect to dashboard
          window.location.href = '/';
        } else {
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error('Callback error:', error);
        window.location.href = '/';
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
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          animation: 'spin 1s linear infinite',
          width: '40px',
          height: '40px',
          border: '2px solid transparent',
          borderTopColor: '#ffffff',
          borderRadius: '50%',
          marginBottom: '16px',
        }} />
        <p>Authenticating...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
