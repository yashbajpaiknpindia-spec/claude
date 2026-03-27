'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Globe, FileText, CreditCard } from 'lucide-react';
import Link from 'next/link';

const EXAMPLES = [
  'Dark portfolio for a senior React engineer who loves open source',
  'Clean resume for a UX designer at top tech companies',
  'Premium business card for a marketing consultant',
  'Minimalist portfolio for a freelance photographer',
  'Bold portfolio for a full-stack startup CTO',
];

const PRODUCT_TYPES = [
  { id: 'portfolio', label: 'Portfolio', icon: Globe, desc: 'Full website' },
  { id: 'resume', label: 'Resume / CV', icon: FileText, desc: 'ATS-optimized' },
  { id: 'business_card', label: 'Business Card', icon: CreditCard, desc: 'Digital & print' },
];

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('portfolio');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exampleIdx, setExampleIdx] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    // Store in session, redirect to editor with generation in progress
    sessionStorage.setItem('bf_prompt', prompt);
    sessionStorage.setItem('bf_type', type);
    router.push('/generate');
  };

  const cycleExample = () => {
    setExampleIdx((i) => (i + 1) % EXAMPLES.length);
    setPrompt(EXAMPLES[(exampleIdx + 1) % EXAMPLES.length]);
  };

  return (
    <div className="min-h-screen bg-[#080808] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orb */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#7c6af7]/10 blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c6af7] to-[#c084fc] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-syne font-bold text-lg tracking-tight">BrandForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/templates" className="btn-ghost btn text-sm px-4 py-2">Templates</Link>
          <Link href="/pricing" className="btn-ghost btn text-sm px-4 py-2">Pricing</Link>
          <Link href="/login" className="btn-secondary btn text-sm px-4 py-2">Sign in</Link>
          <Link href="/signup" className="btn-primary btn text-sm px-4 py-2">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#7c6af7]/30 bg-[#7c6af7]/10 px-4 py-1.5 text-sm text-[#9d95ff] mb-8"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Generate in under 10 seconds</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-7xl font-syne font-bold tracking-tight leading-[1.05] text-balance mb-6"
        >
          Your personal brand,
          <br />
          <span className="gradient-text">built in seconds.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-white/50 max-w-2xl mb-12 text-balance"
        >
          Describe yourself in plain English. BrandForge generates a stunning portfolio,
          resume, or business card — ready to share in seconds.
        </motion.p>

        {/* Type selector */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-2 mb-5 p-1 rounded-xl bg-white/5 border border-white/8"
        >
          {PRODUCT_TYPES.map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                type === id
                  ? 'bg-[#7c6af7] text-white shadow-lg shadow-[#7c6af7]/30'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </motion.div>

        {/* Prompt input */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-3xl"
        >
          <div className="relative glass rounded-2xl p-2 border border-white/10 focus-within:border-[#7c6af7]/40 transition-colors duration-300">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
              placeholder={`e.g. "${EXAMPLES[0]}"`}
              rows={3}
              className="w-full bg-transparent text-white placeholder:text-white/25 resize-none px-4 py-3 text-base focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <button
                onClick={cycleExample}
                className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                Try an example
              </button>
              <motion.button
                onClick={handleGenerate}
                disabled={prompt.length < 10 || isGenerating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary btn px-6 py-2.5 text-sm rounded-xl disabled:opacity-30"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
          <p className="text-xs text-white/25 mt-3">Press ⌘+Enter to generate · No credit card required</p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-16 flex items-center gap-8 text-white/25 text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c6af7]/60 to-[#c084fc]/60 border-2 border-[#080808]" />
              ))}
            </div>
            <span>12,000+ brands built</span>
          </div>
          <div>·</div>
          <span>Avg. generation: 6.2s</span>
          <div>·</div>
          <span>Free to start</span>
        </motion.div>
      </main>

      {/* Feature grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '✦',
              title: 'AI-Powered Generation',
              desc: 'Claude writes your story. GPT structures your layout. Together they create something remarkable.',
            },
            {
              icon: '◈',
              title: 'Canva-like Editor',
              desc: 'Live preview, inline editing, theme switching. Edit every word without touching code.',
            },
            {
              icon: '⬡',
              title: 'One-Click Deploy',
              desc: 'Publish to your own URL instantly. Share your portfolio before lunch.',
            },
          ].map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-2xl p-6 border border-white/[0.06] hover:border-white/[0.1] transition-colors"
            >
              <div className="text-2xl text-[#7c6af7] mb-4 font-mono">{feat.icon}</div>
              <h3 className="font-syne font-semibold text-lg mb-2">{feat.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
