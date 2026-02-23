'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

const supabase = getSupabase();

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    industry: '',
    status: 'active',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('clients').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clients').insert([formData]);
        if (error) throw error;
      }
      setFormData({ name: '', email: '', company: '', industry: '', status: 'active' });
      setEditingId(null);
      setShowForm(false);
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  }

  function handleEdit(client: any) {
    setFormData({
      name: client.name || '',
      email: client.email || '',
      company: client.company || '',
      industry: client.industry || '',
      status: client.status || 'active',
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: '#065f46', text: '#6ee7b7' },
      paused: { bg: '#713f12', text: '#fde68a' },
      completed: { bg: '#334155', text: '#cbd5e1' },
    };
    const c = colors[status] || colors.completed;
    return {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '600',
      backgroundColor: c.bg,
      color: c.text,
    };
  };

  const styles = {
    container: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
    },
    title: { fontSize: '32px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' },
    subtitle: { color: '#94a3b8', fontSize: '14px' },
    addBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
    },
    card: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '14px',
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '14px',
      marginBottom: '16px',
    },
    formActions: { display: 'flex', gap: '12px' },
    submitBtn: {
      padding: '10px 20px',
      backgroundColor: '#10b981',
      color: '#ffffff',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
    },
    cancelBtn: {
      padding: '10px 20px',
      backgroundColor: '#334155',
      color: '#ffffff',
      borderRadius: '8px',
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
    actionBtn: {
      padding: '6px 12px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      marginRight: '8px',
    },
    empty: {
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      padding: '48px',
      textAlign: 'center' as const,
      color: '#94a3b8',
    },
  };

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Clients</h1>
            <p style={styles.subtitle}>Manage your client portfolio</p>
          </div>
          <button
            style={styles.addBtn}
            onClick={() => {
              setFormData({ name: '', email: '', company: '', industry: '', status: 'active' });
              setEditingId(null);
              setShowForm(!showForm);
            }}
          >
            + Add Client
          </button>
        </div>

        {showForm && (
          <div style={styles.card}>
            <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {editingId ? 'Edit Client' : 'New Client'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  style={styles.input}
                />
              </div>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={styles.select}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <div style={styles.formActions}>
                <button type="submit" style={styles.submitBtn}>
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={styles.empty}>Loading clients...</div>
        ) : clients.length === 0 ? (
          <div style={styles.empty}>No clients yet. Add one to get started.</div>
        ) : (
          <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#0f172a';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ ...styles.td, fontWeight: '500', color: '#ffffff' }}>{client.name}</td>
                    <td style={styles.td}>{client.company || '-'}</td>
                    <td style={{ ...styles.td, fontSize: '13px' }}>{client.email || '-'}</td>
                    <td style={styles.td}>
                      <span style={statusBadge(client.status)}>{client.status}</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button
                        onClick={() => handleEdit(client)}
                        style={{ ...styles.actionBtn, backgroundColor: '#1e40af', color: '#ffffff' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        style={{ ...styles.actionBtn, backgroundColor: '#991b1b', color: '#ffffff' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
