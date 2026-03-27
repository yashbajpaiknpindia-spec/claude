'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Linkedin, Sparkles, Copy, Check, ArrowRight, ChevronDown } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

interface LinkedInResult {
  headline: string;
  about: string;
  contentIdeas: string[];
}

export default function LinkedInOptimizerPage() {
  const { post } = useApi();
  const [form, setForm] = useState({ role: '', goals: '', currentHeadline: '', currentAbout: '' });
  const [result, setResult] = useState<LinkedInResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await post('/linkedin/optimize', form);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#080808] px-6 py-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#0a66c2] flex items-center justify-center">
          <Linkedin className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-syne font-bold text-2xl">LinkedIn Optimizer</h1>
          <p className="text-white/40 text-sm">Write headlines and bios that get you noticed</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* Input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/40 block mb-2">Your role / title *</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Senior Product Designer at Figma"
              required
              className="input"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-2">Your goals *</label>
            <textarea
              value={form.goals}
              onChange={(e) => setForm({ ...form, goals: e.target.value })}
              placeholder="e.g. Looking for a senior IC role at a growth-stage startup, want to attract recruiters from FAANG companies"
              rows={3}
              required
              className="input resize-none"
            />
          </div>

          {/* Optional: paste current profile */}
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="text-xs text-white/30 flex items-center gap-1.5 hover:text-white/60 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCurrent ? 'rotate-180' : ''}`} />
            Paste current profile for comparison (optional)
          </button>

          <AnimatePresence>
            {showCurrent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div>
                  <label className="text-xs text-white/40 block mb-2">Current headline</label>
                  <input
                    type="text"
                    value={form.currentHeadline}
                    onChange={(e) => setForm({ ...form, currentHeadline: e.target.value })}
                    placeholder="Your current LinkedIn headline"
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-2">Current about section</label>
                  <textarea
                    value={form.currentAbout}
                    onChange={(e) => setForm({ ...form, currentAbout: e.target.value })}
                    placeholder="Paste your current LinkedIn about section..."
                    rows={4}
                    className="input resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading || !form.role || !form.goals}
            className="btn-primary btn w-full py-3.5 gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Optimize my LinkedIn
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="h-px bg-white/[0.06]" />
              <h2 className="font-syne font-bold text-lg">Your optimized profile ✨</h2>

              {/* Headline */}
              <ResultBlock
                label="Headline"
                content={result.headline}
                onCopy={() => copyText(result.headline, 'headline')}
                copied={copied === 'headline'}
                charCount={result.headline.length}
                charLimit={220}
              />

              {/* About */}
              <ResultBlock
                label="About Section"
                content={result.about}
                onCopy={() => copyText(result.about, 'about')}
                copied={copied === 'about'}
                charCount={result.about.length}
                charLimit={2600}
                multiline
              />

              {/* Content ideas */}
              {result.contentIdeas?.length > 0 && (
                <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Content Ideas 💡</h3>
                    <span className="text-xs text-white/30">{result.contentIdeas.length} ideas</span>
                  </div>
                  <div className="space-y-2">
                    {result.contentIdeas.map((idea, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 text-sm text-white/60 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                      >
                        <span className="font-mono text-[#7c6af7] text-xs mt-0.5 flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1">{idea}</span>
                        <button
                          onClick={() => copyText(idea, `idea-${i}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white"
                        >
                          {copied === `idea-${i}` ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultBlock({
  label, content, onCopy, copied, charCount, charLimit, multiline = false,
}: {
  label: string; content: string; onCopy: () => void; copied: boolean;
  charCount: number; charLimit: number; multiline?: boolean;
}) {
  const pct = Math.min((charCount / charLimit) * 100, 100);
  const isOver = charCount > charLimit;

  return (
    <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{label}</h3>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${isOver ? 'text-red-400' : 'text-white/30'}`}>
            {charCount}/{charLimit}
          </span>
          <button
            onClick={onCopy}
            className="btn-ghost btn p-1.5 text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {multiline ? (
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{content}</p>
      ) : (
        <p className="text-sm text-white/70">{content}</p>
      )}

      {/* Char bar */}
      <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: isOver ? '#ef4444' : '#7c6af7' }}
        />
      </div>
    </div>
  );
}
