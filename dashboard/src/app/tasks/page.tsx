'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';

const supabase = getSupabase();

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTasks(data);
    setLoading(false);
  };

  const styles = {
    container: {
      padding: '32px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '32px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#94a3b8',
      fontSize: '14px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '32px',
    },
  };

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Tasks</h1>
          <p style={styles.subtitle}>Create and manage marketing campaigns</p>
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
    </AppShell>
  );
}
