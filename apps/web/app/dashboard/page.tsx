'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Globe,
  FileText,
  CreditCard,
  ExternalLink,
  MoreHorizontal,
  Sparkles,
  BarChart2,
  Eye,
} from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import { useProfile } from '@/hooks/use-profile';

// ✅ Define Project type (fixes your build error)
type Project = {
  id: string;
  name: string;
  type: string;
  status: string;
  score?: number | null;
  updatedAt: string;
  deployedUrl?: string | null;
};

const TYPE_ICONS = {
  portfolio: Globe,
  resume: FileText,
  business_card: CreditCard,
};

const TYPE_LABELS = {
  portfolio: 'Portfolio',
  resume: 'Resume',
  business_card: 'Business Card',
};

const STATUS_COLORS = {
  draft: '#64748b',
  published: '#22c55e',
  archived: '#f59e0b',
};

export default function DashboardPage() {
  const router = useRouter();
  const { projects, isLoading } = useProjects();
  const { profile } = useProfile();

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c6af7] to-[#c084fc] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-syne font-bold text-lg">BrandForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/analytics" className="btn-ghost btn text-sm px-3 py-2 gap-1.5">
            <BarChart2 className="w-4 h-4" />
            Analytics
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c6af7]/60 to-[#c084fc]/60 flex items-center justify-center text-xs font-bold">
            {profile?.fullName?.charAt(0) || profile?.phone?.charAt(0) || '?'}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-syne text-3xl font-bold">
              {profile?.fullName
                ? `Welcome back, ${profile.fullName.split(' ')[0]}`
                : 'Your brands'}
            </h1>
            <p className="text-white/40 mt-1">
              {projects?.length || 0} project
              {projects?.length !== 1 ? 's' : ''}
              {profile?.plan === 'free' &&
                ` · ${profile.credits} generation${
                  profile.credits !== 1 ? 's' : ''
                } remaining`}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="btn-primary btn px-5 py-2.5 text-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            New project
          </button>
        </div>

        {/* Plan banner */}
        {profile?.plan === 'free' && profile.credits <= 1 && (
          <div className="mb-6 p-4 rounded-xl border border-[#f59e0b]/20 bg-[#f59e0b]/5 flex items-center justify-between">
            <div className="text-sm text-[#f59e0b]">
              {profile.credits === 0
                ? "⚠️ You've used all your free generations."
                : '⚠️ Last free generation remaining.'}
            </div>
            <Link href="/pricing" className="text-xs font-semibold text-[#f59e0b] hover:underline">
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {/* Projects */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-48 rounded-2xl" />
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <EmptyState onNew={() => router.push('/')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ✅ FIXED: typed project */}
            {projects?.map((project: Project, i: number) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}

            {/* New card */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (projects?.length || 0) * 0.05 }}
              onClick={() => router.push('/')}
              className="h-48 rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-[#7c6af7]/30 hover:bg-[#7c6af7]/5 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 text-white/30 group-hover:text-[#7c6af7]" />
              <span className="text-sm text-white/30 group-hover:text-white/60">
                New project
              </span>
            </motion.button>
          </div>
        )}
      </main>
    </div>
  );
}

// ✅ Typed component
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const TypeIcon =
    TYPE_ICONS[project.type as keyof typeof TYPE_ICONS] || Globe;

  const statusColor =
    STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] ||
    '#64748b';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-[#0d0d0d] border border-white/[0.06] rounded-2xl overflow-hidden"
    >
      <div className="h-28 flex items-center justify-center">
        <TypeIcon className="w-8 h-8 text-[#7c6af7]/30" />
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold">{project.name}</h3>
        <p className="text-xs text-white/40">{project.status}</p>
      </div>
    </motion.div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-20">
      <Sparkles className="w-8 h-8 mx-auto mb-4 text-[#7c6af7]" />
      <h2>No projects yet</h2>
      <button onClick={onNew}>Create one</button>
    </div>
  );
}
