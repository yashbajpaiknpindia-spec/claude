'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

interface Stage {
  id: string;
  label: string;
  detail: string;
  duration: number; // expected ms
}

const STAGES: Stage[] = [
  { id: 'claude', label: 'Crafting your narrative', detail: 'Claude is writing your story, tagline, and personal brand voice...', duration: 3000 },
  { id: 'structuring', label: 'Designing your layout', detail: 'Selecting the perfect sections and visual structure...', duration: 2500 },
  { id: 'rendering', label: 'Generating content', detail: 'Populating every section with tailored content...', duration: 2000 },
  { id: 'done', label: 'Finalizing', detail: 'Polishing and preparing your brand...', duration: 500 },
];

export default function GeneratePage() {
  const router = useRouter();
  const { post } = useApi();
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const prompt = sessionStorage.getItem('bf_prompt');
    const type = sessionStorage.getItem('bf_type') || 'portfolio';

    if (!prompt) {
      router.push('/');
      return;
    }

    runGeneration(prompt, type);
  }, []);

  const runGeneration = async (prompt: string, type: string) => {
    // Animate stages while API call runs
    const stageInterval = setInterval(() => {
      setCurrentStage((s) => {
        if (s < STAGES.length - 2) return s + 1;
        return s;
      });
    }, 2800);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + (90 - p) * 0.05;
      });
    }, 100);

    try {
      const result = await post('/generate', { prompt, type });
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      setCurrentStage(STAGES.length - 1);
      setProgress(100);

      // Store result, navigate to editor
      sessionStorage.setItem('bf_result', JSON.stringify(result.data));
      sessionStorage.removeItem('bf_prompt');
      sessionStorage.removeItem('bf_type');

      await new Promise((r) => setTimeout(r, 600));
      router.push(`/editor/${result.data.projectId}`);
    } catch (err: unknown) {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-syne text-xl font-bold mb-2">Generation failed</h2>
          <p className="text-white/40 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary btn px-6 py-3">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7c6af7]/8 blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Logo pulse */}
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7c6af7] to-[#c084fc] flex items-center justify-center mb-8 shadow-lg shadow-[#7c6af7]/30"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <h1 className="font-syne text-2xl font-bold mb-2 text-center">Building your brand</h1>
        <p className="text-white/40 text-sm mb-10 text-center">This takes about 8–10 seconds</p>

        {/* Stage list */}
        <div className="w-full space-y-3 mb-8">
          {STAGES.slice(0, -1).map((stage, idx) => {
            const state = idx < currentStage ? 'done' : idx === currentStage ? 'active' : 'pending';
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-500 ${
                  state === 'active'
                    ? 'bg-[#7c6af7]/10 border-[#7c6af7]/30'
                    : state === 'done'
                    ? 'bg-white/[0.02] border-white/[0.04] opacity-60'
                    : 'bg-white/[0.01] border-white/[0.03] opacity-30'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {state === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                  ) : state === 'active' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-[#7c6af7]/30 border-t-[#7c6af7] rounded-full"
                    />
                  ) : (
                    <Circle className="w-5 h-5 text-white/20" />
                  )}
                </div>
                <div>
                  <div className={`font-medium text-sm ${state === 'active' ? 'text-white' : 'text-white/50'}`}>
                    {stage.label}
                  </div>
                  {state === 'active' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-white/35 mt-0.5"
                    >
                      {stage.detail}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#7c6af7] to-[#c084fc]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between w-full mt-2">
          <span className="text-xs text-white/25">Generating…</span>
          <span className="text-xs text-white/25">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
