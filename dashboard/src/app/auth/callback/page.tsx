'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams?.get('code');
        
        if (code) {
          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Auth error:', error);
            router.push('/auth?error=exchange_failed');
            return;
          }

          if (data?.user?.email) {
            // Check if email is @berelvant.com
            if (!data.user.email.endsWith('@berelvant.com')) {
              await supabase.auth.signOut();
              router.push('/auth?error=domain');
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
                authorized: false,
                created_at: new Date(),
              });
            }

            // Redirect to dashboard
            router.push('/');
          }
        } else {
          router.push('/auth?error=no_code');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/auth?error=true');
      }
    };

    handleCallback();
  }, [searchParams, router]);

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
