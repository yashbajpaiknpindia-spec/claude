'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

interface Revenue { mrr: number; arr: number; proSubscribers: number; agencySubscribers: number; }

export default function AdminRevenuePage() {
  const [data, setData] = useState<Revenue | null>(null);
  const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;
  const tok = () => localStorage.getItem('bf_admin_token') || '';

  useEffect(() => {
    fetch(`${BASE}/revenue`, { headers: { 'x-admin-token': tok() } })
      .then(r => r.json()).then(d => setData(d.data));
  }, []);

  const F = { fontFamily: 'Inter, system-ui, sans-serif' };

  return (
    <div style={{ ...F, padding: '36px 40px', maxWidth: '900px' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', marginBottom: '4px' }}>Revenue</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>Subscription metrics</p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { l: 'MRR', v: data ? `$${data.mrr.toLocaleString()}` : '—', icon: DollarSign, c: '#30d158' },
          { l: 'ARR (projected)', v: data ? `$${data.arr.toLocaleString()}` : '—', icon: TrendingUp, c: '#0a84ff' },
          { l: 'Pro Subscribers', v: data?.proSubscribers ?? '—', icon: Users, c: '#0a84ff' },
          { l: 'Agency Subscribers', v: data?.agencySubscribers ?? '—', icon: Users, c: '#ffd60a' },
        ].map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{s.l}</span>
              <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: `${s.c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={14} color={s.c} />
              </div>
            </div>
            <div style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff' }}>{s.v}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '22px 24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' }}>Pricing breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { plan: 'Pro', price: '$12/mo', count: data?.proSubscribers || 0, color: '#0a84ff' },
            { plan: 'Agency', price: '$49/mo', count: data?.agencySubscribers || 0, color: '#ffd60a' },
          ].map(r => (
            <div key={r.plan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#1c1c1e', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{r.plan}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{r.price}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{r.count} users</div>
                <div style={{ fontSize: '11px', color: r.color }}>${(r.count * parseInt(r.price.replace(/\D/g,''))).toLocaleString()}/mo</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
