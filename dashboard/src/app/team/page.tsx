'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

const supabase = getSupabase();

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('authorized_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    container: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
    header: { marginBottom: '32px' },
    title: { fontSize: '32px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' },
    subtitle: { color: '#94a3b8', fontSize: '14px' },
    card: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      backgroundColor: '#0f172a',
      color: '#94a3b8',
      padding: '12px 16px',
      textAlign: 'left' as const,
      borderBottom: '1px solid #334155',
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    td: {
      color: '#e2e8f0',
      padding: '12px 16px',
      borderBottom: '1px solid #1e293b',
      fontSize: '14px',
    },
    statusBadge: (authorized: boolean) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: authorized ? '#065f46' : '#713f12',
      color: authorized ? '#6ee7b7' : '#fde68a',
    }),
    empty: {
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      padding: '48px',
      textAlign: 'center' as const,
      color: '#94a3b8',
    },
    hint: {
      fontSize: '13px',
      color: '#64748b',
      marginTop: '16px',
    },
  };

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Team</h1>
          <p style={styles.subtitle}>View team members and their access status</p>
        </div>

        {loading ? (
          <div style={styles.empty}>Loading team members...</div>
        ) : members.length === 0 ? (
          <div style={styles.empty}>No team members found.</div>
        ) : (
          <>
            <div style={styles.card}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#0f172a';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ ...styles.td, fontWeight: '500', color: '#ffffff' }}>{member.email}</td>
                      <td style={styles.td}>
                        <span style={styles.statusBadge(member.authorized)}>
                          {member.authorized ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={styles.hint}>
              To manage team access (invite, approve, revoke), use the Admin panel.
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
