'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.email) {
          // Check if email is @berelvant.com
          if (!session.user.email.endsWith('@berelvant.com')) {
            await supabase.auth.signOut();
            router.push('/auth?error=domain');
            return;
          }

          // Redirect to dashboard
          router.push('/');
        } else {
          router.push('/auth');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/auth');
      }
    };

    checkSession();
  }, [router]);

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
