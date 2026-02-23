'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';

const supabase = getSupabase();

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/auth';
        return;
      }

      // Check if email is @berelvant.com
      if (!session.user?.email?.endsWith('@berelvant.com')) {
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

      if (!authUser || !authUser.authorized) {
        await supabase.auth.signOut();
        window.location.href = '/auth?error=unauthorized';
        return;
      }

      setUser(session.user);
      fetchTasks();
      setLoading(false);
    };

    checkAuth();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTasks(data);
    }
    setLoading(false);
  };

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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
      padding: '32px 16px',
    },
    maxWidth: {
      maxWidth: '80rem',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#94a3b8',
    },
    userInfo: {
      color: '#cbd5e1',
      fontSize: '14px',
      marginBottom: '16px',
    },
    actions: {
      display: 'flex',
      gap: '12px',
    },
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
    },
    adminBtn: {
      backgroundColor: '#7c3aed',
      color: '#ffffff',
    },
    logoutBtn: {
      backgroundColor: '#e74c3c',
      color: '#ffffff',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '32px',
    },
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>Mission Control</h1>
            <p style={styles.subtitle}>Marketing Agent Team Orchestrator</p>
            {user && <p style={styles.userInfo}>Logged in as: {user.email}</p>}
          </div>
          <div style={styles.actions}>
            {user?.email === 'principal@berelvant.com' && (
              <button
                style={{ ...styles.button, ...styles.adminBtn }}
                onClick={() => (window.location.href = '/admin')}
              >
                Admin Panel
              </button>
            )}
            <button
              style={{ ...styles.button, ...styles.logoutBtn }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={styles.grid}>
          <div>
            <TaskForm onTaskCreated={fetchTasks} />
          </div>

          <div>
            {loading ? (
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                border: '1px solid #334155',
                padding: '48px',
                textAlign: 'center',
                color: '#94a3b8',
              }}>
                Loading tasks...
              </div>
            ) : (
              <TaskList tasks={tasks} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
