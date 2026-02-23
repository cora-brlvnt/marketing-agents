'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  userEmail: string;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: 'grid' },
  { href: '/tasks', label: 'Tasks', icon: 'zap' },
  { href: '/clients', label: 'Clients', icon: 'users' },
  { href: '/workflows', label: 'Workflows', icon: 'workflow' },
  { href: '/team', label: 'Team', icon: 'people' },
  { href: '/settings', label: 'Settings', icon: 'gear' },
];

function NavIcon({ type, size = 18 }: { type: string; size?: number }) {
  const s = { width: size, height: size, stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (type) {
    case 'grid':
      return <svg {...s} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>;
    case 'zap':
      return <svg {...s} viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case 'users':
      return <svg {...s} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case 'workflow':
      return <svg {...s} viewBox="0 0 24 24"><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="9" y="15" width="6" height="6" rx="1" /><line x1="6" y1="9" x2="6" y2="12" /><line x1="18" y1="9" x2="18" y2="12" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="12" y1="12" x2="12" y2="15" /></svg>;
    case 'people':
      return <svg {...s} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>;
    case 'gear':
      return <svg {...s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    case 'shield':
      return <svg {...s} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case 'logout':
      return <svg {...s} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
    default:
      return null;
  }
}

export default function Sidebar({ userEmail, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userEmail === 'principal@berelvant.com';

  const styles = {
    sidebar: {
      width: '240px',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column' as const,
      position: 'fixed' as const,
      top: 0,
      left: 0,
      zIndex: 50,
    },
    logo: {
      padding: '24px 20px',
      borderBottom: '1px solid #1e293b',
    },
    logoTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: '-0.025em',
    },
    logoSubtitle: {
      fontSize: '11px',
      color: '#64748b',
      marginTop: '2px',
    },
    nav: {
      flex: 1,
      padding: '16px 12px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
    },
    navItem: (active: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '8px',
      color: active ? '#ffffff' : '#94a3b8',
      backgroundColor: active ? '#1e293b' : 'transparent',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: active ? '600' : '400',
      transition: 'all 0.15s',
      cursor: 'pointer',
      border: 'none',
      width: '100%',
      textAlign: 'left' as const,
    }),
    footer: {
      padding: '16px 12px',
      borderTop: '1px solid #1e293b',
    },
    userEmail: {
      fontSize: '12px',
      color: '#64748b',
      padding: '0 12px',
      marginBottom: '12px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoTitle}>Mission Control</div>
        <div style={styles.logoSubtitle}>Berelvant Platform</div>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={styles.navItem(active)}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                }
              }}
            >
              <NavIcon type={item.icon} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            style={styles.navItem(pathname === '/admin')}
            onMouseEnter={(e) => {
              if (pathname !== '/admin') {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
                (e.currentTarget as HTMLElement).style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== '/admin') {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#94a3b8';
              }
            }}
          >
            <NavIcon type="shield" />
            Admin
          </Link>
        )}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userEmail}>{userEmail}</div>
        <button
          onClick={onLogout}
          style={{
            ...styles.navItem(false),
            color: '#ef4444',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#1e293b';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
          }}
        >
          <NavIcon type="logout" />
          Logout
        </button>
      </div>
    </div>
  );
}
