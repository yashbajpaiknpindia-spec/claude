'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, Trash2, Edit2, Check, X, Phone, AlertTriangle, Crown } from 'lucide-react';

interface Admin {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: 'super_admin' | 'admin';
  is_active: boolean;
  last_login?: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

const ALL_PERMISSIONS = [
  { key: 'view_users', label: 'View users' },
  { key: 'view_projects', label: 'View projects' },
  { key: 'view_analytics', label: 'View analytics' },
  { key: 'view_revenue', label: 'View revenue' },
  { key: 'view_activity', label: 'View activity feed' },
  { key: 'manage_users', label: 'Manage users (edit plan, credits)' },
  { key: 'suspend_users', label: 'Suspend / unsuspend users' },
  { key: 'delete_projects', label: 'Delete projects' },
  { key: 'manage_admins', label: 'Manage other admins' },
];

function useAdminFetch() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bf_admin_token') : '';
  const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;

  const get = (path: string) => fetch(`${BASE}${path}`, { headers: { 'x-admin-token': token || '' } }).then(r => r.json());
  const post = (path: string, body: unknown) => fetch(`${BASE}${path}`, { method: 'POST', headers: { 'x-admin-token': token || '', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
  const patch = (path: string, body: unknown) => fetch(`${BASE}${path}`, { method: 'PATCH', headers: { 'x-admin-token': token || '', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
  const del = (path: string) => fetch(`${BASE}${path}`, { method: 'DELETE', headers: { 'x-admin-token': token || '' } }).then(r => r.json());

  return { get, post, patch, del };
}

export default function ManageAdminsPage() {
  const { get, post, patch, del } = useAdminFetch();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const [newAdmin, setNewAdmin] = useState<{
    phone: string;
    name: string;
    email: string;
    role: string;
    permissions: Record<string, boolean>;
  }>({
    phone: '',
    name: '',
    email: '',
    role: 'admin',
    permissions: {
      view_users: true,
      view_projects: true,
      view_analytics: true,
      view_revenue: false,
      view_activity: true,
      manage_users: false,
      suspend_users: false,
      delete_projects: false,
      manage_admins: false,
    },
  });

  const load = async () => {
    const res = await get('/admins');
    setAdmins(res.data || []);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addAdmin = async () => {
    if (!newAdmin.phone) return;
    const res = await post('/admins', newAdmin);
    if (res.error) { setMessage(`Error: ${res.error}`); return; }
    setMessage(res.message);
    setShowAdd(false);
    setNewAdmin({ phone: '', name: '', email: '', role: 'admin', permissions: { view_users: true, view_projects: true, view_analytics: true, view_revenue: false, view_activity: true, manage_users: false, suspend_users: false, delete_projects: false, manage_admins: false } });
    await load();
  };

  const toggleActive = async (adminId: string, is_active: boolean) => {
    await patch(`/admins/${adminId}`, { is_active: !is_active });
    setMessage(is_active ? 'Admin deactivated.' : 'Admin reactivated.');
    await load();
  };

  const removeAdmin = async (adminId: string, phone: string) => {
    if (!confirm(`Remove admin ${phone}? They will lose all access immediately.`)) return;
    const res = await del(`/admins/${adminId}`);
    setMessage(res.message || res.error);
    await load();
  };

  const isSuperAdmin = (a: Admin) => a.role === 'super_admin' && a.phone === '7897671348';

  return (
    <div className="p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white" style={{ letterSpacing: '-0.04em' }}>
            Admin accounts
          </h1>
          <p className="text-sm text-white/40 mt-1">{admins.length} registered admins</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-white text-black rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-white/90 active:scale-[.98] transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add admin
        </button>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/70 mb-5 flex items-center justify-between"
            onAnimationComplete={() => setTimeout(() => setMessage(''), 3000)}
          >
            {message}
            <button onClick={() => setMessage('')} className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add admin form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-5">New admin</h3>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-xs text-white/40 block mb-2">Phone number *</label>
                  <div className="flex items-center gap-2 bg-[#1c1c1e] border border-white/[0.08] rounded-xl px-3 py-2.5">
                    <Phone className="w-3.5 h-3.5 text-white/30" />
                    <input
                      type="tel" placeholder="e.g. 9876543210"
                      value={newAdmin.phone}
                      onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-2">Name</label>
                  <input
                    type="text" placeholder="Full name"
                    value={newAdmin.name}
                    onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-2">Email (optional)</label>
                  <input
                    type="email" placeholder="admin@example.com"
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-2">Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                    className="w-full bg-[#1c1c1e] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs text-white/40 block mb-3">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm.key} className="flex items-center gap-2.5 cursor-pointer group">
                      <button
                        type="button"
                        onClick={() => setNewAdmin(a => ({ ...a, permissions: { ...a.permissions, [perm.key]: !a.permissions[perm.key] } }))}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                          newAdmin.permissions[perm.key]
                            ? 'bg-white border-white'
                            : 'border-white/20 group-hover:border-white/40'
                        }`}
                      >
                        {newAdmin.permissions[perm.key] && <Check className="w-2.5 h-2.5 text-black" />}
                      </button>
                      <span className="text-xs text-white/60">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowAdd(false)} className="text-sm text-white/40 hover:text-white/70 transition-colors px-4 py-2">Cancel</button>
                <button
                  onClick={addAdmin}
                  disabled={!newAdmin.phone}
                  className="bg-white text-black rounded-full px-5 py-2 text-sm font-semibold hover:bg-white/90 disabled:opacity-30 transition-all"
                >
                  Add admin
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admins list */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-[#141414] animate-pulse" />)
        ) : admins.map((admin, idx) => (
          <motion.div
            key={admin.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                isSuperAdmin(admin) ? 'bg-[#ff453a]/15 text-[#ff453a]' : 'bg-white/[0.06] text-white/60'
              }`}>
                {isSuperAdmin(admin) ? <Crown className="w-5 h-5" /> : (admin.name?.charAt(0) || admin.phone.slice(-2))}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-white">{admin.name || 'Unnamed'}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    admin.role === 'super_admin' ? 'bg-[#ff453a]/10 text-[#ff453a]' : 'bg-white/[0.06] text-white/50'
                  }`}>
                    {admin.role === 'super_admin' ? '⭐ Super Admin' : 'Admin'}
                  </span>
                  {isSuperAdmin(admin) && (
                    <span className="text-[10px] bg-[#ff453a]/10 text-[#ff453a] px-2 py-0.5 rounded-full">You</span>
                  )}
                  {!admin.is_active && (
                    <span className="text-[10px] bg-[#ff9f0a]/10 text-[#ff9f0a] px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="text-xs text-white/40 font-mono">{admin.phone}</div>
                {admin.email && <div className="text-xs text-white/30">{admin.email}</div>}
                <div className="text-[10px] text-white/25 mt-1">
                  Last login: {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'} ·
                  Added {new Date(admin.created_at).toLocaleDateString()}
                </div>

                {/* Permission pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Object.entries(admin.permissions).filter(([, v]) => v).map(([key]) => (
                    <span key={key} className="text-[10px] bg-white/[0.04] text-white/35 px-2 py-0.5 rounded-md">
                      {key.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions (not for self / primary super admin) */}
              {!isSuperAdmin(admin) && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(admin.id, admin.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      admin.is_active
                        ? 'border-white/10 text-white/40 hover:border-[#ff9f0a]/30 hover:text-[#ff9f0a]'
                        : 'border-[#30d158]/20 text-[#30d158] hover:border-[#30d158]/40'
                    }`}
                  >
                    {admin.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => removeAdmin(admin.id, admin.phone)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/20 hover:text-[#ff453a] hover:bg-[#ff453a]/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Security note */}
      <div className="mt-8 flex items-start gap-3 bg-[#ff9f0a]/5 border border-[#ff9f0a]/15 rounded-2xl p-4">
        <AlertTriangle className="w-4 h-4 text-[#ff9f0a] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-white/50 leading-relaxed">
            Every admin login, action, and permission change is permanently recorded in the audit log. Admin sessions expire after 8 hours. The primary super admin account (7897671348) cannot be modified or removed by anyone.
          </p>
        </div>
      </div>
    </div>
  );
}
