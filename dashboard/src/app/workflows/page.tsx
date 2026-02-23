'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';

const supabase = getSupabase();

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_days: 30,
    status: 'active',
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function fetchWorkflows() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase.from('workflows').update(formData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workflows').insert([formData]);
        if (error) throw error;
      }
      setFormData({ name: '', description: '', duration_days: 30, status: 'active' });
      setEditingId(null);
      setShowForm(false);
      fetchWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('workflows').delete().eq('id', id);
      if (error) throw error;
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  }

  function handleEdit(workflow: any) {
    setFormData({
      name: workflow.name || '',
      description: workflow.description || '',
      duration_days: workflow.duration_days || 30,
      status: workflow.status || 'active',
    });
    setEditingId(workflow.id);
    setShowForm(true);
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      active: { bg: '#065f46', text: '#6ee7b7' },
      draft: { bg: '#713f12', text: '#fde68a' },
      archived: { bg: '#334155', text: '#cbd5e1' },
    };
    const c = colors[status] || colors.archived;
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
    input: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '14px',
      marginBottom: '16px',
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '8px',
      color: '#ffffff',
      fontSize: '14px',
      height: '96px',
      resize: 'none' as const,
      marginBottom: '16px',
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginBottom: '16px',
    },
    numberInput: {
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px',
    },
    workflowCard: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '24px',
      transition: 'border-color 0.15s',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
    },
    cardActions: {
      display: 'flex',
      gap: '8px',
    },
    iconBtn: {
      padding: '6px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      backgroundColor: 'transparent',
    },
    cardDescription: {
      fontSize: '14px',
      color: '#94a3b8',
      marginBottom: '12px',
      lineHeight: '1.5',
    },
    cardMeta: {
      fontSize: '12px',
      color: '#64748b',
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
            <h1 style={styles.title}>Workflows</h1>
            <p style={styles.subtitle}>Create and manage workflow templates</p>
          </div>
          <button
            style={styles.addBtn}
            onClick={() => {
              setFormData({ name: '', description: '', duration_days: 30, status: 'active' });
              setEditingId(null);
              setShowForm(!showForm);
            }}
          >
            + Create Workflow
          </button>
        </div>

        {showForm && (
          <div style={styles.card}>
            <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {editingId ? 'Edit Workflow' : 'New Workflow'}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Workflow Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={styles.input}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textarea}
              />
              <div style={styles.formRow}>
                <input
                  type="number"
                  placeholder="Duration (days)"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                  style={styles.numberInput}
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={styles.select}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
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
          <div style={styles.empty}>Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div style={styles.empty}>No workflows yet. Create one to get started.</div>
        ) : (
          <div style={styles.grid}>
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                style={styles.workflowCard}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#475569';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#334155';
                }}
              >
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardTitle}>{workflow.name}</div>
                    <span style={statusBadge(workflow.status)}>{workflow.status}</span>
                  </div>
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => handleEdit(workflow)}
                      style={{ ...styles.iconBtn, color: '#3b82f6' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      style={{ ...styles.iconBtn, color: '#ef4444' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div style={styles.cardDescription}>{workflow.description || 'No description'}</div>
                <div style={styles.cardMeta}>Duration: {workflow.duration_days} days</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
