'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Rocket, Globe, Lock, Copy, Check, ExternalLink, Crown } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

interface PublishModalProps {
  isOpen: boolean;
  project: { id: string; name: string; slug: string | null; status: string; deployedUrl?: string | null };
  onClose: () => void;
}

export function PublishModal({ isOpen, project, onClose }: PublishModalProps) {
  const { post } = useApi();
  const [step, setStep] = useState<'options' | 'deploying' | 'done'>('options');
  const [plan, setPlan] = useState<'free' | 'vercel'>('free');
  const [copied, setCopied] = useState(false);
  const [liveUrl, setLiveUrl] = useState(project.deployedUrl || '');

  const handlePublish = async () => {
    if (plan === 'free') {
      // Free: just set status to published, hosted on our platform
      setStep('deploying');
      await new Promise((r) => setTimeout(r, 1500)); // simulate
      const url = `https://brandforge.io/p/${project.slug}`;
      setLiveUrl(url);
      setStep('done');
    } else {
      // Pro: deploy to Vercel
      setStep('deploying');
      const result = await post(`/projects/${project.id}/deploy`, {});
      setLiveUrl(result.data.url);
      setStep('done');
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="font-syne font-bold">Publish "{project.name}"</h2>
                <button onClick={onClose} className="btn-ghost btn p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'options' && (
                  <div className="space-y-4">
                    <p className="text-sm text-white/40 mb-5">Choose how you want to publish your portfolio.</p>

                    {/* Free option */}
                    <button
                      onClick={() => setPlan('free')}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        plan === 'free'
                          ? 'border-[#7c6af7]/50 bg-[#7c6af7]/10'
                          : 'border-white/[0.08] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-[#22c55e] mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-semibold text-sm mb-0.5">BrandForge Hosting</div>
                          <div className="text-xs text-white/40 leading-relaxed">
                            brandforge.io/p/{project.slug} · Free · Live immediately
                          </div>
                        </div>
                        {plan === 'free' && (
                          <div className="ml-auto w-4 h-4 rounded-full bg-[#7c6af7] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Pro option */}
                    <button
                      onClick={() => setPlan('vercel')}
                      className={`w-full text-left p-4 rounded-xl border transition-all relative ${
                        plan === 'vercel'
                          ? 'border-[#7c6af7]/50 bg-[#7c6af7]/10'
                          : 'border-white/[0.08] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Rocket className="w-5 h-5 text-[#7c6af7] mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Deploy to Vercel</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 flex items-center gap-1">
                              <Crown className="w-2.5 h-2.5" /> Pro
                            </span>
                          </div>
                          <div className="text-xs text-white/40 leading-relaxed mt-0.5">
                            Custom domain · Global CDN · Zero downtime
                          </div>
                        </div>
                        {plan === 'vercel' && (
                          <div className="ml-auto w-4 h-4 rounded-full bg-[#7c6af7] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Visibility note */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <Lock className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-white/30 leading-relaxed">
                        Your portfolio will be publicly accessible via the URL. You can unpublish any time from the dashboard.
                      </p>
                    </div>

                    <button
                      onClick={handlePublish}
                      className="btn-primary btn w-full py-3 text-sm gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      Publish now
                    </button>
                  </div>
                )}

                {step === 'deploying' && (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 border-2 border-[#7c6af7]/20 border-t-[#7c6af7] rounded-full mx-auto mb-5"
                    />
                    <h3 className="font-syne font-semibold mb-2">Publishing...</h3>
                    <p className="text-sm text-white/40">
                      {plan === 'vercel' ? 'Deploying to Vercel edge network...' : 'Making your portfolio live...'}
                    </p>
                  </div>
                )}

                {step === 'done' && (
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-14 h-14 bg-[#22c55e]/10 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    >
                      <Check className="w-7 h-7 text-[#22c55e]" />
                    </motion.div>
                    <h3 className="font-syne font-bold text-lg mb-2">You're live! 🎉</h3>
                    <p className="text-sm text-white/40 mb-6">Your portfolio is published and accessible worldwide.</p>

                    {/* URL */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 px-4 py-3 mb-5">
                      <Globe className="w-4 h-4 text-[#22c55e] flex-shrink-0" />
                      <span className="text-sm text-white flex-1 truncate text-left">{liveUrl}</span>
                      <button onClick={copyUrl} className="btn-ghost btn p-1">
                        {copied ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary btn flex-1 py-2.5 text-sm gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View live
                      </a>
                      <button onClick={onClose} className="btn-primary btn flex-1 py-2.5 text-sm">
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
