'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AuditEntry { id: string; action: string; target_type: string; target_id: string; ip_address: string; created_at: string; }

const ACTION_COLORS: Record<string, string> = {
  login: '#30d158', logout: '#6b7280', view_users_list: '#0a84ff',
  view_user_detail: '#0a84ff', change_user_plan: '#ffd60a', suspend_user: '#ff453a',
  add_admin: '#30d158', remove_admin: '#ff453a', update_admin: '#ffd60a',
  delete_project: '#ff453a', view_overview: '#6b7280', view_revenue: '#6b7280',
};

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;
  const tok = () => localStorage.getItem('bf_admin_token') || '';

  useEffect(() => {
    fetch(`${BASE}/audit-log?limit=100`, { headers: { 'x-admin-token': tok() } })
      .then(r => r.json()).then(d => { setEntries(d.data || []); setLoading(false); });
  }, []);

  const F = { fontFamily: 'Inter, system-ui, sans-serif' };

  return (
    <div style={{ ...F, padding: '36px 40px', maxWidth: '900px' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', marginBottom: '4px' }}>Audit Log</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>Every admin action, permanently recorded</p>
      </motion.div>
      <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>Loading…</div> :
          entries.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 18px', borderBottom: i < entries.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACTION_COLORS[e.action] || '#6b7280', flexShrink: 0, display: 'inline-block' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>{e.action.replace(/_/g, ' ')}</span>
                {e.target_type && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: '8px' }}>on {e.target_type}</span>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{new Date(e.created_at).toLocaleString()}</div>
                {e.ip_address && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{e.ip_address}</div>}
              </div>
            </div>
          ))
        }
        {!loading && entries.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No audit entries yet</div>}
      </div>
    </div>
  );
}
