'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      // Get the code from URL
      const code = searchParams?.get('code');
      
      if (code) {
        try {
          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Auth error:', error);
            window.location.href = '/auth?error=true';
            return;
          }

          if (data?.user?.email) {
            // Check if email is @berelvant.com
            if (!data.user.email.endsWith('@berelvant.com')) {
              // Reject non-Berelvant emails
              await supabase.auth.signOut();
              window.location.href = '/auth?error=domain';
              return;
            }

            // Check if user is authorized
            const { data: authUser } = await supabase
              .from('authorized_users')
              .select('*')
              .eq('email', data.user.email)
              .single();

            if (!authUser) {
              // First-time user, add to authorized_users
              await supabase.from('authorized_users').insert({
                email: data.user.email,
                authorized: false, // Pending approval
                created_at: new Date(),
              });
            }

            // Redirect to dashboard
            window.location.href = '/';
          }
        } catch (error) {
          console.error('Callback error:', error);
          window.location.href = '/auth?error=true';
        }
      }
    };

    handleCallback();
  }, [searchParams]);

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
