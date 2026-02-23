'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

interface AuthorizedUser {
  id: string;
  email: string;
  authorized: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user?.email?.endsWith('@berelvant.com') || session.user.email !== 'principal@berelvant.com') {
        window.location.href = '/';
        return;
      }

      setUser(session.user);
      fetchUsers();
      setLoading(false);
    };

    checkAuth();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('authorized_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail.endsWith('@berelvant.com')) {
      alert('Only @berelvant.com emails are allowed');
      return;
    }

    const { error } = await supabase.from('authorized_users').insert({
      email: inviteEmail,
      authorized: true,
      created_at: new Date(),
    });

    if (!error) {
      setInviteEmail('');
      fetchUsers();
    } else {
      alert('Error inviting user: ' + error.message);
    }
  };

  const handleToggleAccess = async (id: string, authorized: boolean) => {
    await supabase
      .from('authorized_users')
      .update({ authorized: !authorized })
      .eq('id', id);

    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Remove this user?')) {
      await supabase.from('authorized_users').delete().eq('id', id);
      fetchUsers();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#ffffff' }}>Loading...</div>;
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
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#ffffff',
    },
    logoutBtn: {
      backgroundColor: '#e74c3c',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
    },
    card: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      color: '#cbd5e1',
      fontSize: '14px',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '14px',
    },
    button: {
      backgroundColor: '#2563eb',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '12px',
      textAlign: 'left' as const,
      borderBottom: '1px solid #334155',
      fontSize: '14px',
      fontWeight: '600',
    },
    td: {
      color: '#e2e8f0',
      padding: '12px',
      borderBottom: '1px solid #334155',
      fontSize: '14px',
    },
    statusBadge: (authorized: boolean) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: authorized ? '#10b981' : '#f59e0b',
      color: authorized ? '#ecfdf5' : '#fef3c7',
    }),
    actionBtn: {
      padding: '4px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      marginRight: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.header}>
          <h1 style={styles.title}>Admin Panel</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="/" style={{ ...styles.logoutBtn, backgroundColor: '#4285F4', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>← Dashboard</a>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Invite New User</h2>
          <form onSubmit={handleInvite}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email (@berelvant.com)</label>
              <input
                style={styles.input}
                type="email"
                placeholder="user@berelvant.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <button style={styles.button} type="submit">
              Invite User
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Authorized Users ({users.length})</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Added</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(u.authorized)}>
                      {u.authorized ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: u.authorized ? '#f59e0b' : '#10b981',
                        color: '#ffffff',
                      }}
                      onClick={() => handleToggleAccess(u.id, u.authorized)}
                    >
                      {u.authorized ? 'Revoke' : 'Approve'}
                    </button>
                    <button
                      style={{
                        ...styles.actionBtn,
                        backgroundColor: '#e74c3c',
                        color: '#ffffff',
                      }}
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
