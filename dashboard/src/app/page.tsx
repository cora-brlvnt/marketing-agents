'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

const supabase = getSupabase();

export default function DashboardPage() {
  const [stats, setStats] = useState({ clients: 0, workflows: 0, tasks: 0, teamMembers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsData, workflowsData, tasksData, teamData] = await Promise.all([
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('workflows').select('*', { count: 'exact', head: true }),
          supabase.from('tasks').select('*', { count: 'exact', head: true }),
          supabase.from('authorized_users').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          clients: clientsData.count || 0,
          workflows: workflowsData.count || 0,
          tasks: tasksData.count || 0,
          teamMembers: teamData.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Clients', value: stats.clients, color: '#3b82f6', href: '/clients' },
    { label: 'Workflows', value: stats.workflows, color: '#8b5cf6', href: '/workflows' },
    { label: 'Tasks', value: stats.tasks, color: '#10b981', href: '/tasks' },
    { label: 'Team Members', value: stats.teamMembers, color: '#f59e0b', href: '/team' },
  ];

  const quickLinks = [
    { href: '/tasks', title: 'Create Campaign', description: 'Launch a new marketing campaign with AI agents' },
    { href: '/clients', title: 'Manage Clients', description: 'View and manage client profiles' },
    { href: '/workflows', title: 'Workflows', description: 'Create and manage workflow templates' },
    { href: '/settings', title: 'Settings', description: 'Configure platform settings' },
  ];

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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '20px',
      marginBottom: '32px',
    },
    statCard: (color: string) => ({
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '24px',
      borderTop: `3px solid ${color}`,
    }),
    statLabel: {
      fontSize: '13px',
      color: '#94a3b8',
      marginBottom: '8px',
      fontWeight: '500',
    },
    statValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#ffffff',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '16px',
    },
    linksGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
    },
    linkCard: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '24px',
      textDecoration: 'none',
      display: 'block',
      transition: 'all 0.15s',
    },
    linkTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: '8px',
    },
    linkDescription: {
      fontSize: '13px',
      color: '#94a3b8',
    },
  };

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Welcome to Mission Control</p>
        </div>

        <div style={styles.statsGrid}>
          {statCards.map((stat) => (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div
                style={styles.statCard(stat.color)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = stat.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#334155';
                }}
              >
                <div style={styles.statLabel}>{stat.label}</div>
                <div style={styles.statValue}>{loading ? '...' : stat.value}</div>
              </div>
            </Link>
          ))}
        </div>

        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.linksGrid}>
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={styles.linkCard}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
                (e.currentTarget as HTMLElement).style.backgroundColor = '#0f172a';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#334155';
                (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
              }}
            >
              <div style={styles.linkTitle}>{link.title}</div>
              <div style={styles.linkDescription}>{link.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
