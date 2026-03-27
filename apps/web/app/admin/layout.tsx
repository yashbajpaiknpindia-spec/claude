'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, BarChart2, Users, Activity, Layers, DollarSign, FileText, UserPlus, LogOut } from 'lucide-react';

interface AdminUser {
  id: string; phone: string; name: string;
  role: 'super_admin' | 'admin';
  permissions: Record<string, boolean>;
}

const NAV = [
  { href: '/admin/dashboard', icon: BarChart2, label: 'Overview', perm: 'view_analytics' },
  { href: '/admin/users', icon: Users, label: 'Users', perm: 'view_users' },
  { href: '/admin/activity', icon: Activity, label: 'Live Activity', perm: 'view_activity', live: true },
  { href: '/admin/projects', icon: Layers, label: 'Projects', perm: 'view_projects' },
  { href: '/admin/revenue', icon: DollarSign, label: 'Revenue', perm: 'view_revenue' },
  { href: '/admin/audit', icon: FileText, label: 'Audit Log', perm: null, superOnly: true },
  { href: '/admin/admins', icon: UserPlus, label: 'Admins', perm: 'manage_admins', superOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Login page — no auth check needed
    if (pathname === '/admin') { setChecking(false); return; }

    const token = localStorage.getItem('bf_admin_token');
    const stored = localStorage.getItem('bf_admin');
    if (!token || !stored) { router.replace('/admin'); return; }
    try { setAdmin(JSON.parse(stored)); } catch { router.replace('/admin'); return; }
    setChecking(false);
  }, [pathname, router]);

  // On the login page itself, just render children with no chrome
  if (pathname === '/admin') return <>{children}</>;

  if (checking) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#ff453a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!admin) return null;

  const canSee = (item: typeof NAV[0]) => {
    if (item.superOnly && admin.role !== 'super_admin') return false;
    if (item.perm && !admin.permissions[item.perm]) return false;
    return true;
  };

  const signOut = async () => {
    const token = localStorage.getItem('bf_admin_token');
    if (token) {
      const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;
      fetch(`${BASE}/auth/logout`, { method: 'POST', headers: { 'x-admin-token': token } }).catch(() => {});
    }
    localStorage.removeItem('bf_admin_token');
    localStorage.removeItem('bf_admin');
    document.cookie = 'bf_admin_token=; path=/; max-age=0';
    router.replace('/admin');
  };

  const F = { fontFamily: 'Inter, system-ui, sans-serif' };

  return (
    <div style={{ ...F, display: 'flex', height: '100vh', background: '#000', overflow: 'hidden', minWidth: 0 }}>
      {/* Sidebar */}
      <aside style={{ width: '210px', background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', flexShrink: 0, minWidth: 0 }}>
        {/* Brand */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: '#ff453a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>BrandForge</div>
              <div style={{ fontSize: '10px', color: '#ff453a', fontWeight: 500 }}>Admin Console</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.filter(canSee).map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 10px',
                borderRadius: '10px', marginBottom: '2px', textDecoration: 'none',
                background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: '13px', fontWeight: active ? 500 : 400,
                transition: 'all 0.15s',
              }}
                onMouseOver={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseOut={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              >
                <item.icon size={14} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, letterSpacing: '-0.01em' }}>{item.label}</span>
                {item.live && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#30d158', animation: 'blink 2s infinite', display: 'inline-block' }} />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '10px', marginBottom: '4px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,69,58,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#ff453a', flexShrink: 0 }}>
              {(admin.name || 'A')[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.name || 'Admin'}</div>
              <div style={{ fontSize: '10px', color: admin.role === 'super_admin' ? '#ff453a' : 'rgba(255,255,255,0.3)' }}>
                {admin.role === 'super_admin' ? '⭐ Super Admin' : 'Admin'}
              </div>
            </div>
          </div>
          <button onClick={signOut} style={{
            display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 10px',
            borderRadius: '10px', background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
            onMouseOver={e => { e.currentTarget.style.color = '#ff453a'; e.currentTarget.style.background = 'rgba(255,69,58,0.06)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={13} />Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#0a0a0a' }}>
        {children}
      </main>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
