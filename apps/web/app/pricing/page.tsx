'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: Sparkles,
    color: '#64748b',
    description: 'Try before you commit.',
    features: [
      '5 AI generations',
      '3 active projects',
      'Portfolio, Resume, Business Card',
      'BrandForge hosting (brandforge.io/p/...)',
      'PDF resume export',
      'Portfolio score & feedback',
      'Basic analytics',
    ],
    cta: 'Get started free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    icon: Zap,
    color: '#7c6af7',
    description: 'For professionals who want to stand out.',
    features: [
      'Unlimited AI generations',
      'Unlimited projects',
      'Custom domain deployment via Vercel',
      'LinkedIn optimizer',
      'Advanced analytics (countries, sections)',
      'Remove BrandForge branding',
      'Priority AI generation',
      'Roast my portfolio (unlimited)',
      'Email support',
    ],
    cta: 'Start Pro',
    href: '/signup?plan=pro',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$49',
    period: 'per month',
    icon: Crown,
    color: '#f59e0b',
    description: 'For teams and talent agencies.',
    features: [
      'Everything in Pro',
      'Up to 25 client workspaces',
      'White-label option',
      'Team collaboration',
      'Bulk generation',
      'API access',
      'Custom templates',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Start Agency',
    href: '/signup?plan=agency',
    highlight: false,
  },
];

export default function PricingPage() {
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
        <Link href="/login" className="btn-secondary btn text-sm px-4 py-2">Sign in</Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <span className="section-label block mb-4">Pricing</span>
          <h1 className="font-syne text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-white/40 text-lg">Start free. Upgrade when you're ready.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.highlight
                  ? 'border-[#7c6af7]/40 bg-[#7c6af7]/5'
                  : 'border-white/[0.07] bg-[#0d0d0d]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7c6af7] text-white text-xs font-bold px-4 py-1 rounded-full">
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${plan.color}15` }}
                >
                  <plan.icon className="w-4 h-4" style={{ color: plan.color }} />
                </div>
                <h2 className="font-syne font-bold text-xl mb-1">{plan.name}</h2>
                <p className="text-white/40 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-syne text-4xl font-bold">{plan.price}</span>
                <span className="text-white/40 text-sm ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/60">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`btn w-full py-3 text-sm text-center font-semibold rounded-xl transition-all ${
                  plan.highlight
                    ? 'bg-[#7c6af7] text-white hover:bg-[#9d95ff]'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="font-syne text-2xl font-bold text-center mb-10">Common questions</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { q: 'How fast is generation?', a: 'Average generation time is 6–8 seconds. We run Claude and GPT-4o in an optimized pipeline.' },
              { q: 'Can I edit the generated content?', a: 'Yes, 100%. The Canva-like editor lets you change every word, color, font, and layout.' },
              { q: 'What happens when I cancel Pro?', a: "You keep all your projects. They stay live on BrandForge hosting. Custom domain deployments remain active until they're removed." },
              { q: 'Is the PDF ATS-friendly?', a: 'Yes. Our PDF export uses semantic HTML with no tables or columns that confuse ATS parsers.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-[#0d0d0d] border border-white/[0.06] rounded-xl p-5">
                <h3 className="font-semibold mb-2 text-sm">{faq.q}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
