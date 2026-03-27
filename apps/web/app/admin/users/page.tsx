'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Zap, FileText } from 'lucide-react';

interface User {
  id: string; phone: string; full_name?: string;
  plan: string; credits: number; created_at: string; updated_at: string;
}
interface UserDetail {
  profile: User;
  projects: { id: string; name: string; type: string; status: string; created_at: string }[];
  recentGenerations: { id: string; prompt: string; status: string; duration_ms: number; created_at: string }[];
}

const PLAN_COLORS: Record<string, string> = { free: '#6b7280', pro: '#0a84ff', agency: '#ffd60a' };

function useAdminApi() {
  const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;
  const tok = () => localStorage.getItem('bf_admin_token') || '';
  const get = (p: string) => fetch(`${BASE}${p}`, { headers: { 'x-admin-token': tok() } }).then(r => r.json());
  const patch = (p: string, b: unknown) => fetch(`${BASE}${p}`, { method: 'PATCH', headers: { 'x-admin-token': tok(), 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
  return { get, patch };
}

export default function AdminUsersPage() {
  const { get, patch } = useAdminApi();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editPlan, setEditPlan] = useState<{ id: string; plan: string; credits: number } | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: '20', search, plan });
    const r = await get(`/users?${q}`);
    setUsers(r.data || []); setTotal(r.total || 0); setIsLoading(false);
  }, [search, plan, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => setPage(1), 400); return () => clearTimeout(t); }, [search]);

  const openDetail = async (id: string) => {
    setLoadingDetail(true); setDetail(null);
    const r = await get(`/users/${id}`);
    setDetail(r.data); setLoadingDetail(false);
  };

  const savePlan = async () => {
    if (!editPlan) return;
    await patch(`/users/${editPlan.id}/plan`, { plan: editPlan.plan, credits: editPlan.credits });
    setEditPlan(null); load();
  };

  const F = { fontFamily: 'Inter, system-ui, sans-serif' };

  return (
    <div style={{ ...F, padding: '36px 40px', maxWidth: '1100px' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', marginBottom: '4px' }}>Users</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '28px' }}>{total.toLocaleString()} accounts</p>
      </motion.div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '9px 14px', flex: 1, maxWidth: '360px' }}>
          <Search size={14} color="rgba(255,255,255,0.3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name…"
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', fontFamily: 'inherit', flex: 1 }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}><X size={13} /></button>}
        </div>
        <select value={plan} onChange={e => { setPlan(e.target.value); setPage(1); }}
          style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '12px', fontFamily: 'inherit', padding: '9px 14px', cursor: 'pointer', outline: 'none' }}>
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="agency">Agency</option>
        </select>
      </div>

      <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['User', 'Plan', 'Credits', 'Joined', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 16px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array(6).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={5} style={{ padding: '13px 16px' }}>
                <div style={{ height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }} />
              </td></tr>
            )) : users.map((u, i) => (
              <tr key={u.id} onClick={() => openDetail(u.id)}
                style={{ borderBottom: i < users.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${PLAN_COLORS[u.plan] || '#6b7280'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: PLAN_COLORS[u.plan] || '#6b7280', flexShrink: 0 }}>
                      {(u.full_name || u.phone || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>{u.full_name || '—'}</div>
                      <div style={{ color: 'rgba(255,255,255,0.38)' }}>{u.phone}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px', background: `${PLAN_COLORS[u.plan]}18`, color: PLAN_COLORS[u.plan], textTransform: 'capitalize' }}>{u.plan}</span>
                </td>
                <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{u.credits}</td>
                <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.38)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px', color: '#0a84ff', fontSize: '11px' }}>View →</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && users.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '13px' }}>No users found</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>{Math.min((page-1)*20+1,total)}–{Math.min(page*20,total)} of {total.toLocaleString()}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['← Prev', 'Next →'].map((l, i) => {
            const disabled = i === 0 ? page === 1 : page * 20 >= total;
            return <button key={l} onClick={() => setPage(p => i === 0 ? Math.max(1,p-1) : p+1)} disabled={disabled}
              style={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: disabled ? 'rgba(255,255,255,0.2)' : '#fff', padding: '7px 14px', fontSize: '12px', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{l}</button>;
          })}
        </div>
      </div>

      {/* Slide-in detail */}
      <AnimatePresence>
        {(detail || loadingDetail) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
            onClick={e => { if (e.target === e.currentTarget) { setDetail(null); setEditPlan(null); } }}>
            <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              style={{ width: 'min(420px, 100vw)', height: '100%', background: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', fontFamily: 'inherit' }}>
              {loadingDetail ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                  <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#0a84ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : detail && (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${PLAN_COLORS[detail.profile.plan]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: PLAN_COLORS[detail.profile.plan] }}>
                        {(detail.profile.full_name || detail.profile.phone || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff', letterSpacing: '-0.02em' }}>{detail.profile.full_name || 'No name'}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{detail.profile.phone}</div>
                      </div>
                    </div>
                    <button onClick={() => { setDetail(null); setEditPlan(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { l: 'Plan', v: detail.profile.plan, c: PLAN_COLORS[detail.profile.plan] },
                      { l: 'Credits', v: detail.profile.credits },
                      { l: 'Projects', v: detail.projects.length },
                      { l: 'Generations', v: String(detail.recentGenerations.length) + '+' },
                    ].map(s => (
                      <div key={s.l} style={{ background: '#1c1c1e', borderRadius: '12px', padding: '12px 14px' }}>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: s.c || '#fff', letterSpacing: '-0.03em', textTransform: 'capitalize' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {editPlan?.id === detail.profile.id ? (
                    <div style={{ background: '#1c1c1e', borderRadius: '14px', padding: '14px', marginBottom: '14px', border: '1px solid rgba(10,132,255,0.3)' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change plan</div>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        {['free','pro','agency'].map(p => (
                          <button key={p} onClick={() => setEditPlan(v => v && ({...v, plan: p}))}
                            style={{ flex: 1, padding: '7px', borderRadius: '10px', border: `1px solid ${editPlan.plan===p?PLAN_COLORS[p]:'rgba(255,255,255,0.1)'}`, background: editPlan.plan===p?`${PLAN_COLORS[p]}20`:'transparent', color: editPlan.plan===p?PLAN_COLORS[p]:'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {p}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="number" value={editPlan.credits} onChange={e => setEditPlan(v => v && ({...v, credits: parseInt(e.target.value)||0}))}
                          style={{ flex: 1, background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', padding: '8px 11px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }} />
                        <button onClick={savePlan} style={{ background: '#0a84ff', border: 'none', borderRadius: '10px', color: '#fff', padding: '8px 16px', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500 }}>Save</button>
                        <button onClick={() => setEditPlan(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)', padding: '8px 12px', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setEditPlan({id: detail.profile.id, plan: detail.profile.plan, credits: detail.profile.credits})}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', padding: '10px', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer', marginBottom: '14px' }}>
                      Edit plan & credits
                    </button>
                  )}

                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={11} /> Projects ({detail.projects.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' }}>
                    {detail.projects.slice(0,5).map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c1c1e', borderRadius: '10px', padding: '9px 12px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>{p.name}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize', marginTop: '1px' }}>{p.type}</div>
                        </div>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: p.status==='published'?'rgba(48,209,88,0.1)':'rgba(255,255,255,0.06)', color: p.status==='published'?'#30d158':'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{p.status}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Zap size={11} /> Recent Generations
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {detail.recentGenerations.slice(0,5).map(j => (
                      <div key={j.id} style={{ background: '#1c1c1e', borderRadius: '10px', padding: '9px 12px' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{j.prompt || '(no prompt)'}</div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
                          <span style={{ fontSize: '10px', color: j.status==='completed'?'#30d158':'#0a84ff' }}>{j.status}</span>
                          {j.duration_ms && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{(j.duration_ms/1000).toFixed(1)}s</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
