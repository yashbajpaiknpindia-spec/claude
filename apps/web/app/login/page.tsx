'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(phone, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6 relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#7c6af7]/8 blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c6af7] to-[#c084fc] flex items-center justify-center">
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>BrandForge</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', textAlign: 'center', marginBottom: 6 }}>Welcome back</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: 28 }}>Sign in to your account</p>

        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '11px 14px' }}>
              <Phone size={15} color="rgba(255,255,255,0.28)" />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoFocus
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '11px 14px' }}>
              <Lock size={15} color="rgba(255,255,255,0.28)" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit' }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', display: 'flex' }}>
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#ff453a' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 4, background: loading ? 'rgba(255,255,255,0.7)' : '#fff', color: '#000', border: 'none', borderRadius: 999, padding: 12, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
            >
              {loading ? (
                <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : <>Sign in <ArrowRight size={14} /></>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#9d95ff', textDecoration: 'none' }}>Sign up free</Link>
        </p>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
