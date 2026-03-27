/**
 * SectionRenderer — The core component system.
 * AI can ONLY fill content + arrange sections.
 * All UI rendering is handled here with reusable components.
 */

import type { Section, Theme } from '@brandforge/types';
import { HeroSection } from './sections/hero-section';
import {
  AboutSection,
  ProjectsSection,
  SkillsSection,
  ExperienceSection,
  TestimonialsSection,
  ContactSection,
  ResumeHeaderSection,
  ResumeSummarySection,
  ResumeExperienceSection,
  ResumeSkillsSection,
  ResumeEducationSection,
  CardFrontSection,
  CardBackSection,
} from './sections/index';

interface SectionRendererProps {
  section: Section;
  theme: Theme;
  isEditing?: boolean;
  onUpdate?: (content: Record<string, unknown>) => void;
}

const SECTION_MAP: Record<string, React.ComponentType<SectionRendererProps>> = {
  hero: HeroSection,
  about: AboutSection,
  projects: ProjectsSection,
  skills: SkillsSection,
  experience: ExperienceSection,
  testimonials: TestimonialsSection,
  contact: ContactSection,
  resume_header: ResumeHeaderSection,
  resume_summary: ResumeSummarySection,
  resume_experience: ResumeExperienceSection,
  resume_skills: ResumeSkillsSection,
  resume_education: ResumeEducationSection,
  card_front: CardFrontSection,
};

export function SectionRenderer({ section, theme, isEditing, onUpdate }: SectionRendererProps) {
  const sectionType = section.type || section.id?.split('-')[0];
  const Component = SECTION_MAP[sectionType];

  if (!Component) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm bg-gray-50">
        Unknown section type: {sectionType}
      </div>
    );
  }

  return (
    <Component
      section={section}
      theme={theme}
      isEditing={isEditing}
      onUpdate={onUpdate}
    />
  );
}
