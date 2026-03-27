'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, TrendingUp, DollarSign, ArrowUpRight, Activity } from 'lucide-react';

interface Overview {
  totalUsers: number;
  proUsers: number;
  totalProjects: number;
  todayGenerations: number;
  todaySignups: number;
  mrr: number;
}

function useAdminApi() {
  const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;
  const token = () => typeof window !== 'undefined' ? localStorage.getItem('bf_admin_token') || '' : '';
  const get = (path: string) =>
    fetch(`${BASE}${path}`, { headers: { 'x-admin-token': token() } }).then(r => r.json());
  return { get };
}

const Stat = ({ label, value, delta, icon: Icon, accent, delay }: {
  label: string; value: string | number; delta?: string; icon: React.ElementType; accent: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    style={{
      background: '#141414', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px', padding: '22px 24px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</span>
      <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={accent} />
      </div>
    </div>
    <div style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1 }}>
      {value}
    </div>
    {delta && (
      <div style={{ fontSize: '11px', color: '#30d158', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
        <ArrowUpRight size={11} />
        {delta}
      </div>
    )}
  </motion.div>
);

export default function AdminDashboardPage() {
  const { get } = useAdminApi();
  const [data, setData] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<{ recentGenerations: { id: string; prompt: string; created_at: string; status: string }[] }>({ recentGenerations: [] });

  useEffect(() => {
    Promise.all([get('/overview'), get('/activity')])
      .then(([overview, activity]) => {
        if (overview.data) setData(overview.data);
        if (activity.data) setRecentActivity(activity.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const stats = data ? [
    { label: 'Total Users', value: data.totalUsers.toLocaleString(), icon: Users, accent: '#0a84ff', delta: `+${data.todaySignups} today` },
    { label: 'Pro Subscribers', value: data.proUsers.toLocaleString(), icon: TrendingUp, accent: '#30d158', delta: `${data.totalUsers > 0 ? ((data.proUsers / data.totalUsers) * 100).toFixed(1) : 0}% conversion` },
    { label: 'Generations Today', value: data.todayGenerations.toLocaleString(), icon: Zap, accent: '#ffd60a' },
    { label: 'MRR', value: `$${data.mrr.toLocaleString()}`, icon: DollarSign, accent: '#30d158', delta: 'Monthly recurring' },
  ] : [];

  return (
    <div style={{ padding: '36px 40px', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '1100px' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', marginBottom: '4px' }}>Overview</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '32px' }}>Platform performance at a glance</p>
      </motion.div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '120px', borderRadius: '20px', background: '#141414', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          {stats.map((s, i) => <Stat key={s.label} {...s} delay={i * 0.06} />)}
        </div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} color="#0a84ff" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Recent Generations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30d158', display: 'inline-block', animation: 'blink 2s infinite' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Live</span>
          </div>
        </div>
        {recentActivity.recentGenerations.slice(0, 8).map((job, i) => (
          <div
            key={job.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 22px',
              borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              animation: `fadeIn 0.3s ease both`, animationDelay: `${i * 0.04}s`,
            }}
          >
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: job.status === 'completed' ? '#30d158' : job.status === 'running' ? '#0a84ff' : '#ff453a', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {job.prompt || '(no prompt)'}
              </p>
            </div>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
              {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {recentActivity.recentGenerations.length === 0 && !isLoading && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No recent activity</div>
        )}
      </motion.div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}
