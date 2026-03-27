'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Palette, Layers, BarChart2, ArrowLeft, Share2, Download, Rocket, Sparkles, ChevronRight } from 'lucide-react';
import { SectionRenderer } from '@/components/renderer/section-renderer';
import { ThemePanel } from '@/components/editor/theme-panel';
import { SectionsPanel } from '@/components/editor/sections-panel';
import { ScorePanel } from '@/components/editor/score-panel';
import { PublishModal } from '@/components/editor/publish-modal';
import { useProject } from '@/hooks/use-project';
import { useApi } from '@/hooks/use-api';
import type { Section, Theme } from '@brandforge/types';

type PanelTab = 'sections' | 'theme' | 'score' | null;

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { patch } = useApi();
  const { project, isLoading, mutate } = useProject(id);

  const [activePanel, setActivePanel] = useState<PanelTab>('sections');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Load from sessionStorage if fresh generation
  const [localProject, setLocalProject] = useState<typeof project>(null);
  useEffect(() => {
    const stored = sessionStorage.getItem('bf_result');
    if (stored && !project) {
      const data = JSON.parse(stored);
      setLocalProject(data);
    }
  }, [project]);

  const activeProject = project || localProject;

  const handleSectionUpdate = useCallback(
    async (sectionId: string, content: Record<string, unknown>) => {
      if (!activeProject) return;
      setIsSaving(true);
      const updatedContent = { ...activeProject.content, [sectionId]: content };
      await patch(`/projects/${id}`, { content: updatedContent });
      mutate();
      setIsSaving(false);
    },
    [activeProject, id, patch, mutate]
  );

  const handleThemeUpdate = useCallback(
    async (theme: Partial<Theme>) => {
      if (!activeProject) return;
      await patch(`/projects/${id}`, { theme: { ...activeProject.theme, ...theme } });
      mutate();
    },
    [activeProject, id, patch, mutate]
  );

  const handleLayoutUpdate = useCallback(
    async (sections: string[]) => {
      if (!activeProject) return;
      await patch(`/projects/${id}`, { layout: { ...activeProject.layout, sections } });
      mutate();
    },
    [activeProject, id, patch, mutate]
  );

  if (isLoading && !localProject) {
    return (
      <div className="h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7c6af7]/30 border-t-[#7c6af7] rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeProject) return null;

  const sections: Section[] = activeProject.layout?.sections?.map((sId: string, idx: number) => ({
    id: sId,
    type: sId.split('-')[0] as never,
    order: idx,
    visible: true,
    content: (activeProject.content?.[sId] as Record<string, unknown>) || {},
  })) || [];

  return (
    <div className="h-screen bg-[#080808] flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-white/[0.06] flex items-center px-4 gap-4 flex-shrink-0 bg-[#0a0a0a]">
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-ghost btn p-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-2">
          <h1 className="font-syne font-semibold text-sm truncate max-w-xs">{activeProject.name}</h1>
          {isSaving && (
            <span className="text-xs text-white/30 flex items-center gap-1.5">
              <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
              Saving…
            </span>
          )}
        </div>

        {/* Preview mode toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {(['desktop', 'mobile'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                previewMode === mode ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {mode === 'desktop' ? '⬛ Desktop' : '📱 Mobile'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-ghost btn text-xs px-3 py-2 gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          {activeProject.type === 'resume' && (
            <button className="btn-secondary btn text-xs px-3 py-2 gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </button>
          )}
          <button
            onClick={() => setShowPublishModal(true)}
            className="btn-primary btn text-xs px-4 py-2 gap-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            Publish
          </button>
        </div>
      </header>

      {/* Editor body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar — tools */}
        <aside className="hidden md:flex w-14 border-r border-white/[0.06] flex-col items-center py-4 gap-2 bg-[#0a0a0a]">
          {[
            { id: 'sections' as PanelTab, icon: Layers, label: 'Sections' },
            { id: 'theme' as PanelTab, icon: Palette, label: 'Theme' },
            { id: 'score' as PanelTab, icon: BarChart2, label: 'Score' },
          ].map(({ id: panelId, icon: Icon, label }) => (
            <button
              key={panelId}
              onClick={() => setActivePanel(activePanel === panelId ? null : panelId)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${
                activePanel === panelId
                  ? 'bg-[#7c6af7] text-white'
                  : 'text-white/30 hover:text-white hover:bg-white/5'
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </aside>

        {/* Panel */}
        <AnimatePresence>
          {activePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="hidden md:block border-r border-white/[0.06] overflow-hidden bg-[#0d0d0d] flex-shrink-0"
            >
              <div className="w-[300px] h-full overflow-y-auto">
                {activePanel === 'sections' && (
                  <SectionsPanel
                    sections={sections}
                    layout={activeProject.layout}
                    onLayoutUpdate={handleLayoutUpdate}
                    editingSection={editingSection}
                    onEditSection={setEditingSection}
                  />
                )}
                {activePanel === 'theme' && (
                  <ThemePanel
                    theme={activeProject.theme}
                    onUpdate={handleThemeUpdate}
                  />
                )}
                {activePanel === 'score' && (
                  <ScorePanel projectId={id} score={activeProject.score} feedback={activeProject.scoreFeedback} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas / Preview */}
        <main className="flex-1 bg-[#060606] overflow-auto flex items-start justify-center p-8">
          <motion.div
            animate={{
              width: previewMode === 'mobile' ? 390 : '100%',
              maxWidth: previewMode === 'mobile' ? 390 : 1200,
            }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/50 min-h-[400px] md:min-h-[800px] w-full"
          >
            <PortfolioPreview
              sections={sections}
              theme={activeProject.theme}
              editingSection={editingSection}
              onSectionClick={setEditingSection}
              onSectionUpdate={handleSectionUpdate}
            />
          </motion.div>
        </main>

        {/* Right panel — inline section editor */}
        <AnimatePresence>
          {editingSection && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block border-l border-white/[0.06] bg-[#0d0d0d] flex-shrink-0 overflow-hidden"
            >
              <div className="w-[320px] h-full overflow-y-auto">
                <SectionEditor
                  sectionId={editingSection}
                  content={(activeProject.content?.[editingSection] as Record<string, unknown>) || {}}
                  onUpdate={(content) => handleSectionUpdate(editingSection, content)}
                  onClose={() => setEditingSection(null)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PublishModal
        isOpen={showPublishModal}
        project={activeProject}
        onClose={() => setShowPublishModal(false)}
      />
    </div>
  );
}

// ─── Portfolio Preview Component ──────────────────────────────

function PortfolioPreview({
  sections,
  theme,
  editingSection,
  onSectionClick,
  onSectionUpdate,
}: {
  sections: Section[];
  theme: Theme;
  editingSection: string | null;
  onSectionClick: (id: string) => void;
  onSectionUpdate: (id: string, content: Record<string, unknown>) => void;
}) {
  return (
    <div
      style={{
        '--preview-bg': theme?.colors?.bg || '#fff',
        '--preview-accent': theme?.colors?.accent || '#6366f1',
        '--preview-text': theme?.colors?.text || '#111',
        '--preview-muted': theme?.colors?.textMuted || '#64748b',
        '--preview-font-heading': `'${theme?.font?.heading || 'Syne'}'`,
        '--preview-font-body': `'${theme?.font?.body || 'DM Sans'}'`,
        background: theme?.colors?.bg || '#fff',
        color: theme?.colors?.text || '#111',
        minHeight: '100%',
      } as React.CSSProperties}
    >
      {sections
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <div
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`relative cursor-pointer group transition-all ${
              editingSection === section.id ? 'ring-2 ring-[#7c6af7] ring-inset' : 'hover:ring-1 hover:ring-white/20 hover:ring-inset'
            }`}
          >
            {/* Edit indicator */}
            <div className={`absolute top-2 right-2 z-50 ${editingSection === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <div className="bg-[#7c6af7] text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {editingSection === section.id ? 'Editing' : 'Click to edit'}
              </div>
            </div>
            <SectionRenderer
              section={section}
              theme={theme}
              isEditing={editingSection === section.id}
              onUpdate={(content) => onSectionUpdate(section.id, content)}
            />
          </div>
        ))}
    </div>
  );
}

// ─── Section inline editor ────────────────────────────────────

function SectionEditor({
  sectionId,
  content,
  onUpdate,
  onClose,
}: {
  sectionId: string;
  content: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(content);
  const [isDirty, setIsDirty] = useState(false);

  const update = (key: string, value: unknown) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    setIsDirty(true);
  };

  const save = () => {
    onUpdate(local);
    setIsDirty(false);
  };

  const sectionType = sectionId.split('-')[0];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div>
          <h3 className="font-syne font-semibold text-sm capitalize">{sectionType.replace('_', ' ')}</h3>
          <p className="text-xs text-white/30">Edit section content</p>
        </div>
        <button onClick={onClose} className="btn-ghost btn p-1.5 text-xs">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(local).map(([key, value]) => {
          if (typeof value === 'string') {
            const isLong = value.length > 100;
            return (
              <div key={key}>
                <label className="text-xs text-white/40 capitalize block mb-1.5">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                {isLong ? (
                  <textarea
                    value={value}
                    onChange={(e) => update(key, e.target.value)}
                    rows={4}
                    className="input text-sm resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => update(key, e.target.value)}
                    className="input text-sm"
                  />
                )}
              </div>
            );
          }
          if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
            return (
              <div key={key}>
                <label className="text-xs text-white/40 capitalize block mb-1.5">{key}</label>
                {value.map((item: string, i: number) => (
                  <input
                    key={i}
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const arr = [...value];
                      arr[i] = e.target.value;
                      update(key, arr);
                    }}
                    className="input text-sm mb-2"
                  />
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>

      {isDirty && (
        <div className="p-4 border-t border-white/[0.06]">
          <button onClick={save} className="btn-primary btn w-full py-2.5 text-sm">
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}
