'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Globe, FileText, CreditCard, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTemplates } from '@/hooks/use-projects';

const TYPE_FILTERS = [
  { id: '', label: 'All' },
  { id: 'portfolio', label: 'Portfolios', icon: Globe },
  { id: 'resume', label: 'Resumes', icon: FileText },
  { id: 'business_card', label: 'Business Cards', icon: CreditCard },
];

const THEME_PREVIEWS: Record<string, { gradient: string; accent: string }> = {
  'Nova Dark': { gradient: 'from-[#0a0a0a] to-[#111]', accent: '#6366f1' },
  'Clarity Light': { gradient: 'from-white to-[#f8fafc]', accent: '#0f172a' },
  'Executive': { gradient: 'from-white to-[#f1f5f9]', accent: '#1e3a5f' },
  'Tech Resume': { gradient: 'from-white to-[#eff6ff]', accent: '#2563eb' },
  'Obsidian Card': { gradient: 'from-[#09090b] to-[#1c1c1e]', accent: '#ffd700' },
};

export default function TemplatesPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState('');
  const { templates, isLoading } = useTemplates(activeType || undefined);

  const handleUseTemplate = (templateId: string, templateName: string) => {
    sessionStorage.setItem('bf_template_id', templateId);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c6af7] to-[#c084fc] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-syne font-bold text-lg">BrandForge</span>
        </Link>
        <Link href="/dashboard" className="btn-primary btn text-sm px-4 py-2">
          My projects
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <span className="section-label block mb-4">Templates</span>
          <h1 className="font-syne text-5xl font-bold mb-4">
            Start with a template,<br />make it yours in seconds
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Every template is fully customizable. Pick one, describe yourself,
            and AI does the rest.
          </p>
        </div>

        {/* Type filter */}
        <div className="flex justify-center gap-2 mb-10">
          {TYPE_FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveType(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                activeType === id
                  ? 'bg-[#7c6af7] text-white border-[#7c6af7]'
                  : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {/* Template grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="shimmer h-72 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(templates || []).map((template: {
              id: string; name: string; description: string; type: string;
              is_premium: boolean; use_count: number; theme: { colors?: { accent?: string; bg?: string } };
            }, i: number) => {
              const preview = THEME_PREVIEWS[template.name] || { gradient: 'from-[#111] to-[#0a0a0a]', accent: '#7c6af7' };
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group bg-[#0d0d0d] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.14] transition-all"
                >
                  {/* Preview */}
                  <div className={`h-44 bg-gradient-to-br ${preview.gradient} relative flex items-center justify-center overflow-hidden`}>
                    {/* Mock content preview */}
                    <div className="absolute inset-0 p-6 flex flex-col gap-2 pointer-events-none">
                      <div className="h-3 w-2/3 rounded" style={{ background: preview.accent, opacity: 0.9 }} />
                      <div className="h-2 w-1/2 rounded bg-white/20" />
                      <div className="h-2 w-3/4 rounded bg-white/10 mt-1" />
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-8 flex-1 rounded-lg bg-white/5 border border-white/10" />
                        ))}
                      </div>
                    </div>

                    {template.is_premium && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] text-xs px-2 py-1 rounded-full">
                        <Crown className="w-3 h-3" /> Pro
                      </div>
                    )}

                    {/* Hover action */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleUseTemplate(template.id, template.name)}
                        className="btn-primary btn text-sm px-4 py-2 gap-1.5"
                      >
                        Use template
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-syne font-semibold">{template.name}</h3>
                      <span className="text-xs text-white/25 capitalize">{template.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-white/40">{template.description}</p>
                    {template.use_count > 0 && (
                      <p className="text-xs text-white/20 mt-2">{template.use_count.toLocaleString()} uses</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-white/40 mb-4">Don't see what you need? Start from scratch with a prompt.</p>
          <Link href="/" className="btn-secondary btn px-6 py-3 text-sm gap-2">
            <Sparkles className="w-4 h-4" />
            Generate with AI prompt
          </Link>
        </div>
      </main>
    </div>
  );
}
