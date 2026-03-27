'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface Project { id: string; name: string; type: string; status: string; slug: string; score: number; deployed_url: string; created_at: string; user_id: string; }

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;
  const tok = () => localStorage.getItem('bf_admin_token') || '';

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE}/projects?page=${page}&limit=25`, { headers: { 'x-admin-token': tok() } })
      .then(r => r.json()).then(d => { setProjects(d.data || []); setTotal(d.total || 0); setLoading(false); });
  }, [page]);

  const F = { fontFamily: 'Inter, system-ui, sans-serif' };
  const SC: Record<string, string> = { published: '#30d158', draft: '#6b7280', archived: '#ffd60a' };
  const TC: Record<string, string> = { portfolio: '#0a84ff', resume: '#30d158', business_card: '#ffd60a' };

  return (
    <div style={{ ...F, padding: '36px 40px', maxWidth: '1100px' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', marginBottom: '4px' }}>All Projects</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>{total.toLocaleString()} total</p>
      </motion.div>
      <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Name', 'Type', 'Status', 'Score', 'Created'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 16px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array(8).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={5} style={{ padding: '13px 16px' }}><div style={{ height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} /></td></tr>
            )) : projects.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < projects.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>{p.name}</div>
                  {p.slug && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px', fontFamily: 'monospace' }}>{p.slug}</div>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', background: `${TC[p.type] || '#6b7280'}18`, color: TC[p.type] || '#6b7280', textTransform: 'capitalize' }}>{p.type?.replace('_',' ')}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 500, padding: '3px 9px', borderRadius: '999px', background: `${SC[p.status] || '#6b7280'}15`, color: SC[p.status] || '#6b7280', textTransform: 'capitalize' }}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 16px', color: p.score >= 80 ? '#30d158' : p.score >= 60 ? '#ffd60a' : 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>{p.score ?? '—'}</td>
                <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.38)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && projects.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No projects yet</div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        {['← Prev','Next →'].map((l,i) => {
          const dis = i===0?page===1:page*25>=total;
          return <button key={l} onClick={()=>setPage(p=>i===0?Math.max(1,p-1):p+1)} disabled={dis}
            style={{ background:'#1c1c1e',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',color:dis?'rgba(255,255,255,0.2)':'#fff',padding:'7px 14px',fontSize:'12px',cursor:dis?'not-allowed':'pointer',fontFamily:'inherit' }}>{l}</button>;
        })}
      </div>
    </div>
  );
}
