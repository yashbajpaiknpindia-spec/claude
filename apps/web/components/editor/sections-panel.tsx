'use client';

import { useState, useRef } from 'react';
import type { Section, ProjectLayout } from '@brandforge/types';
import { GripVertical, Eye, EyeOff, Plus, Trash2, Edit2 } from 'lucide-react';

interface SectionsPanelProps {
  sections: Section[];
  layout: ProjectLayout;
  onLayoutUpdate: (sections: string[]) => void;
  editingSection: string | null;
  onEditSection: (id: string | null) => void;
}

const SECTION_META: Record<string, { label: string; icon: string; description: string }> = {
  hero: { label: 'Hero', icon: '✦', description: 'Headline, tagline, CTA' },
  about: { label: 'About', icon: '◈', description: 'Bio, highlights' },
  projects: { label: 'Projects', icon: '⬡', description: 'Portfolio work' },
  skills: { label: 'Skills', icon: '◎', description: 'Technical skills' },
  experience: { label: 'Experience', icon: '◷', description: 'Work history' },
  testimonials: { label: 'Testimonials', icon: '❝', description: 'Social proof' },
  contact: { label: 'Contact', icon: '✉', description: 'Get in touch' },
  resume_header: { label: 'Header', icon: '◈', description: 'Name, contact info' },
  resume_summary: { label: 'Summary', icon: '◎', description: 'Professional summary' },
  resume_experience: { label: 'Experience', icon: '◷', description: 'Work history' },
  resume_skills: { label: 'Skills', icon: '✦', description: 'Technical skills' },
  resume_education: { label: 'Education', icon: '⬡', description: 'Degrees' },
  card_front: { label: 'Card Front', icon: '◈', description: 'Name, title, contact' },
  card_back: { label: 'Card Back', icon: '◎', description: 'QR, tagline' },
};

export function SectionsPanel({ sections, layout, onLayoutUpdate, editingSection, onEditSection }: SectionsPanelProps) {
  const [localSections, setLocalSections] = useState(sections);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const dragRef = useRef<{ index: number } | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragRef.current = { index: idx };
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOver(idx);
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (!dragRef.current) return;
    const from = dragRef.current.index;
    if (from === dropIdx) return;

    const reordered = [...localSections];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIdx, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, order: i }));
    setLocalSections(updated);
    onLayoutUpdate(updated.map((s) => s.id));
    dragRef.current = null;
    setDragOver(null);
  };

  const toggleVisibility = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHidden(next);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="font-syne font-semibold text-sm">Sections</h3>
        <p className="text-xs text-white/30 mt-0.5">Drag to reorder</p>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {localSections.map((section, idx) => {
          const sectionType = section.type || (section.id?.split('-')[0] as string);
          const meta = SECTION_META[sectionType] || { label: sectionType, icon: '◈', description: '' };
          const isEditing = editingSection === section.id;
          const isHidden = hidden.has(section.id);

          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              className={`group flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                isEditing
                  ? 'border-[#7c6af7]/40 bg-[#7c6af7]/10'
                  : dragOver === idx
                  ? 'border-[#7c6af7]/20 bg-[#7c6af7]/5'
                  : 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03]'
              } ${isHidden ? 'opacity-40' : ''}`}
            >
              {/* Drag handle */}
              <GripVertical className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />

              {/* Icon */}
              <span className="text-base font-mono flex-shrink-0" style={{ color: isEditing ? '#7c6af7' : '#64748b' }}>
                {meta.icon}
              </span>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{meta.label}</div>
                <div className="text-xs text-white/25 truncate">{meta.description}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditSection(isEditing ? null : section.id)}
                  className={`p-1.5 rounded-md transition-colors ${
                    isEditing ? 'text-[#7c6af7]' : 'text-white/30 hover:text-white'
                  }`}
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => toggleVisibility(section.id)}
                  className="p-1.5 rounded-md text-white/30 hover:text-white transition-colors"
                  title={isHidden ? 'Show' : 'Hide'}
                >
                  {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add section */}
      <div className="p-3 border-t border-white/[0.06]">
        <button className="btn-secondary btn w-full text-xs py-2 gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add section
        </button>
      </div>
    </div>
  );
}
