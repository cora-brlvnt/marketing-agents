'use client';

import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface TaskListProps {
  tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
  const styles = {
    empty: {
      backgroundColor: '#1e293b',
      borderRadius: '8px',
      border: '1px solid #334155',
      padding: '48px',
      textAlign: 'center' as const,
      color: '#94a3b8',
    },
    taskCard: {
      display: 'block',
      backgroundColor: '#1e293b',
      borderRadius: '8px',
      border: '1px solid #334155',
      padding: '24px',
      marginBottom: '16px',
      textDecoration: 'none',
      transition: 'all 0.2s',
      cursor: 'pointer',
    },
    taskTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
    },
    taskDescription: {
      color: '#94a3b8',
      fontSize: '14px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '8px',
    },
    badge: {
      display: 'inline-block',
      backgroundColor: '#b45309',
      color: '#fef3c7',
      fontSize: '12px',
      fontWeight: '600',
      padding: '4px 12px',
      borderRadius: '9999px',
    },
    date: {
      marginTop: '16px',
      fontSize: '12px',
      color: '#64748b',
    },
  };

  if (tasks.length === 0) {
    return <div style={styles.empty}>No tasks yet. Create one to get started.</div>;
  }

  return (
    <div>
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/task/${task.id}`}
          style={styles.taskCard}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
            (e.currentTarget as HTMLElement).style.backgroundColor = '#0f172a';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#334155';
            (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
          }}
        >
          <div style={styles.header}>
            <div style={{ flex: 1 }}>
              <h3 style={styles.taskTitle}>{task.title}</h3>
              <p style={styles.taskDescription}>{task.description}</p>
            </div>
            <span style={styles.badge}>{task.status}</span>
          </div>
          <div style={styles.date}>Created {new Date(task.created_at).toLocaleDateString()}</div>
        </Link>
      ))}
    </div>
  );
}
