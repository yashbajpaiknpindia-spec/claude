'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart2, Eye, MousePointer, Download, Globe, TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/use-projects';

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [days, setDays] = useState(30);
  const { analytics, isLoading } = useAnalytics(id, days);

  const stats = [
    { label: 'Total Views', value: analytics?.totalViews ?? 0, icon: Eye, color: '#7c6af7' },
    { label: 'Unique Visitors', value: analytics?.uniqueVisitors ?? 0, icon: Globe, color: '#22c55e' },
    { label: 'Link Clicks', value: analytics?.totalClicks ?? 0, icon: MousePointer, color: '#38bdf8' },
    { label: 'Resume Downloads', value: analytics?.resumeDownloads ?? 0, icon: Download, color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-[#080808] px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/editor/${id}`} className="btn-ghost btn p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-syne font-bold text-2xl">Analytics</h1>
          <p className="text-white/40 text-sm mt-0.5">Track your portfolio's performance</p>
        </div>
        <div className="ml-auto flex gap-1 bg-white/5 p-1 rounded-lg">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                days === d ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  <span className="text-xs text-white/40">{stat.label}</span>
                </div>
                <div className="font-syne font-bold text-3xl">{stat.value.toLocaleString()}</div>
              </motion.div>
            ))}
          </div>

          {/* Views chart (sparkline) */}
          <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-6 mb-5">
            <h3 className="font-syne font-semibold mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7c6af7]" />
              Daily Views
            </h3>
            {analytics?.dailyViews?.length > 0 ? (
              <Sparkline data={analytics.dailyViews} color="#7c6af7" />
            ) : (
              <div className="h-24 flex items-center justify-center text-white/20 text-sm">
                No data yet — share your portfolio to start tracking
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Top countries */}
            <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="font-syne font-semibold mb-5 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#38bdf8]" />
                Top Countries
              </h3>
              {analytics?.topCountries?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topCountries.map((c: { country: string; count: number }) => {
                    const max = analytics.topCountries[0].count;
                    return (
                      <div key={c.country}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{c.country}</span>
                          <span className="text-white/40">{c.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-[#38bdf8]"
                            style={{ width: `${(c.count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-white/20 text-sm">No country data yet</p>
              )}
            </div>

            {/* Section engagement */}
            <div className="bg-[#0d0d0d] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="font-syne font-semibold mb-5 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#22c55e]" />
                Section Engagement
              </h3>
              {analytics?.sectionEngagement?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.sectionEngagement.map((s: { section: string; views: number; clicks: number }) => (
                    <div key={s.section} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-white/70">{s.section.replace('_', ' ')}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-[#7c6af7]">{s.views} views</span>
                        <span className="text-[#22c55e]">{s.clicks} clicks</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/20 text-sm">No engagement data yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sparkline chart (pure SVG, no deps) ─────────────────────
function Sparkline({ data, color }: { data: { date: string; views: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.views), 1);
  const W = 600;
  const H = 80;
  const padX = 4;
  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1 || 1)) * (W - padX * 2);
    const y = H - (d.views / max) * (H - 8);
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const area = `${padX},${H} ${polyline} ${W - padX},${H}`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="w-full h-24">
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#sg)" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Latest dot */}
        {pts.length > 0 && (
          <circle
            cx={pts[pts.length - 1].split(',')[0]}
            cy={pts[pts.length - 1].split(',')[1]}
            r="3"
            fill={color}
          />
        )}
      </svg>
      <div className="flex justify-between text-xs text-white/20 mt-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
