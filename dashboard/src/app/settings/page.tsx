'use client';

import AppShell from '@/components/AppShell';

export default function SettingsPage() {
  const styles = {
    container: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
    header: { marginBottom: '32px' },
    title: { fontSize: '32px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' },
    subtitle: { color: '#94a3b8', fontSize: '14px' },
    card: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '48px',
      textAlign: 'center' as const,
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '12px',
    },
    cardText: {
      color: '#94a3b8',
      fontSize: '14px',
    },
  };

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Configure your platform settings</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Platform Settings</div>
          <p style={styles.cardText}>Settings configuration coming soon.</p>
        </div>
      </div>
    </AppShell>
  );
}
