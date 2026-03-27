'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Job { id: string; prompt: string; status: string; created_at: string; user_id: string; }
interface Publish { id: string; name: string; type: string; slug: string; updated_at: string; }

export default function AdminActivityPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [publishes, setPublishes] = useState<Publish[]>([]);
  const [loading, setLoading] = useState(true);
  const interval = useRef<ReturnType<typeof setInterval>>();
  const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;
  const tok = () => localStorage.getItem('bf_admin_token') || '';

  const load = async () => {
    const r = await fetch(`${BASE}/activity`, { headers: { 'x-admin-token': tok() } }).then(res => res.json());
    if (r.data) { setJobs(r.data.recentGenerations || []); setPublishes(r.data.recentPublishes || []); }
    setLoading(false);
  };

  useEffect(() => { load(); interval.current = setInterval(load, 10000); return () => clearInterval(interval.current); }, []);

  const F = { fontFamily: 'Inter, system-ui, sans-serif' };
  const statusC: Record<string, string> = { completed: '#30d158', running: '#0a84ff', failed: '#ff453a', queued: '#ffd60a' };

  return (
    <div style={{ ...F, padding: '36px 40px', maxWidth: '900px' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff' }}>Live Activity</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)', borderRadius: '999px', padding: '3px 10px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158', display: 'inline-block', animation: 'blink 2s infinite' }} />
            <span style={{ fontSize: '11px', color: '#30d158', fontWeight: 500 }}>Live</span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>Refreshes every 10 seconds</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Recent Generations</div>
          {loading ? <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Loading…</div> :
            jobs.slice(0, 15).map((j, i) => (
              <div key={j.id} style={{ padding: '11px 20px', borderBottom: i < 14 ? '1px solid rgba(255,255,255,0.04)' : 'none', animation: 'fadeIn .3s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: statusC[j.status] || '#6b7280', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{j.prompt || '(empty prompt)'}</span>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', paddingLeft: '15px' }}>{new Date(j.created_at).toLocaleString()}</div>
              </div>
            ))
          }
        </div>

        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', fontWeight: 600, color: '#fff' }}>Recent Publishes</div>
          {loading ? <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Loading…</div> :
            publishes.slice(0, 15).map((p, i) => (
              <div key={p.id} style={{ padding: '11px 20px', borderBottom: i < 14 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#fff', marginBottom: '2px', letterSpacing: '-0.01em' }}>{p.name}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{p.type} · {p.slug} · {new Date(p.updated_at).toLocaleString()}</div>
              </div>
            ))
          }
          {!loading && publishes.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>No published projects yet</div>}
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}} @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
