'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import Sidebar from './Sidebar';

const supabase = getSupabase();

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/auth';
        return;
      }

      if (!session.user?.email?.endsWith('@berelvant.com')) {
        await supabase.auth.signOut();
        window.location.href = '/auth?error=domain';
        return;
      }

      const { data: authUser } = await supabase
        .from('authorized_users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (!authUser || !authUser.authorized) {
        await supabase.auth.signOut();
        window.location.href = '/auth?error=unauthorized';
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  if (loading) {
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
          <p>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userEmail={user?.email || ''} onLogout={handleLogout} />
      <main style={{
        flex: 1,
        marginLeft: '240px',
        background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
