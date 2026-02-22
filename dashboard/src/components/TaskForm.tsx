'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Client {
  id: string;
  name: string;
}

interface TaskFormProps {
  onTaskCreated: () => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, name').order('name');
    if (data) setClients(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('tasks').insert([
      {
        title,
        description,
        client_id: clientId || null,
        status: 'pending',
        approval_status: 'pending',
      },
    ]);

    if (!error) {
      setTitle('');
      setDescription('');
      setClientId('');
      onTaskCreated();
    }

    setLoading(false);
  };

  const styles = {
    card: {
      backgroundColor: '#1e293b',
      borderRadius: '8px',
      border: '1px solid #334155',
      padding: '24px',
    },
    heading: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: '16px',
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#cbd5e1',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '8px 16px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '14px',
    },
    textarea: {
      width: '100%',
      padding: '8px 16px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '14px',
      height: '96px',
      resize: 'none' as const,
    },
    select: {
      width: '100%',
      padding: '8px 16px',
      backgroundColor: '#0f172a',
      border: '1px solid #475569',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '14px',
    },
    button: {
      width: '100%',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '6px',
      fontWeight: '600',
      transition: 'background-color 0.2s',
      opacity: loading ? 0.5 : 1,
      cursor: 'pointer',
      border: 'none',
    },
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>New Task</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Client (Optional)</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            style={styles.select}
          >
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Campaign Brief</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Q2 GCG Forex Campaign"
            style={styles.input}
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Target audience, key messaging, budget, goals..."
            style={styles.textarea}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={styles.button}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
          }}
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </form>
    </div>
  );
}
