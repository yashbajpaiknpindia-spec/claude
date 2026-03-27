'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin`;

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in — redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('bf_admin_token');
      if (token) router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setError('Enter your phone number and password.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ''), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Check your credentials.');
        return;
      }

      // Persist session
      localStorage.setItem('bf_admin_token', data.token);
      localStorage.setItem('bf_admin', JSON.stringify(data.admin));

      // Set cookie for middleware
      document.cookie = `bf_admin_token=${data.token}; path=/; max-age=28800; samesite=strict`;

      router.replace('/admin/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(255,69,58,0.07) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 1 }}
      >
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={26} color="#ff453a" />
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.04em', textAlign: 'center', color: '#fff', marginBottom: '6px' }}>
          Admin access
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', textAlign: 'center', marginBottom: '32px', letterSpacing: '-0.01em' }}>
          BrandForge Console
        </p>

        <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '11px 14px', transition: 'border-color 0.2s' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <Phone size={15} color="rgba(255,255,255,0.28)" style={{ flexShrink: 0 }} />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoFocus
                autoComplete="username"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', fontFamily: 'inherit', letterSpacing: '-0.01em' }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '11px 14px' }}>
              <Lock size={15} color="rgba(255,255,255,0.28)" style={{ flexShrink: 0 }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '13px', fontFamily: 'inherit', letterSpacing: '0.02em' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.25)' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#ff453a', fontSize: '12px', padding: '8px 12px', background: 'rgba(255,69,58,0.08)', borderRadius: '8px', border: '1px solid rgba(255,69,58,0.15)' }}
              >
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '4px',
                background: isLoading ? 'rgba(255,255,255,0.7)' : '#fff',
                color: '#000',
                border: 'none',
                borderRadius: '999px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'inherit',
                letterSpacing: '-0.01em',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', marginTop: '20px', letterSpacing: '-0.005em' }}>
          Unauthorized access is logged and prosecuted.
        </p>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
