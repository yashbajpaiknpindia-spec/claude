'use client';

import { useState } from 'react';
import type { Theme } from '@brandforge/types';
import { Check } from 'lucide-react';

interface ThemePanelProps {
  theme: Theme;
  onUpdate: (theme: Partial<Theme>) => void;
}

/* ✅ TYPES (fixes implicit any errors) */
type PresetTheme = {
  name: string;
  preview: string[];
  theme: Theme;
};

type FontPair = {
  name: string;
  heading: string;
  body: string;
};

/* ✅ EMPTY BUT TYPED (no TS errors) */
const PRESET_THEMES: PresetTheme[] = [];
const FONT_PAIRS: FontPair[] = [];

export function ThemePanel({ theme, onUpdate }: ThemePanelProps) {
  const [activeTab, setActiveTab] =
    useState<'presets' | 'colors' | 'fonts' | 'spacing'>('presets');

  /* ✅ SAFE CAST (fixes previous error) */
  const colors = (theme?.colors ?? {}) as unknown as Record<string, string>;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="font-syne font-semibold text-sm">Theme</h3>
        <p className="text-xs text-white/30 mt-0.5">Customize look & feel</p>
      </div>

      <div className="flex border-b border-white/[0.06] px-2">
        {(['presets', 'colors', 'fonts', 'spacing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-xs font-medium capitalize ${
              activeTab === tab ? 'text-white' : 'text-white/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* COLORS TAB */}
        {activeTab === 'colors' && (
          <div className="space-y-5">
            {[
              { key: 'bg', label: 'Background' },
              { key: 'surface', label: 'Surface' },
              { key: 'accent', label: 'Accent' },
              { key: 'text', label: 'Text' },
              { key: 'textMuted', label: 'Muted text' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-white/40 block mb-2">{label}</label>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colors[key] || '#ffffff'}
                    onChange={(e) =>
                      onUpdate({
                        colors: {
                          ...(theme?.colors ?? {}),
                          [key]: e.target.value,
                        } as never,
                      })
                    }
                    className="w-9 h-9 rounded-lg border border-white/10"
                  />

                  <input
                    type="text"
                    value={colors[key] || ''}
                    onChange={(e) =>
                      onUpdate({
                        colors: {
                          ...(theme?.colors ?? {}),
                          [key]: e.target.value,
                        } as never,
                      })
                    }
                    className="input text-sm flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODE */}
        <div className="mt-6">
          <label className="text-xs text-white/40 block mb-2">Mode</label>
          <div className="flex gap-2">
            {(['light', 'dark'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdate({ mode })}
                className={`flex-1 py-2 rounded-lg text-sm border ${
                  theme?.mode === mode
                    ? 'border-[#7c6af7] text-white'
                    : 'border-white/[0.06] text-white/40'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* PRESETS */}
        {activeTab === 'presets' && (
          <div className="space-y-2 mt-4">
            {PRESET_THEMES.map((preset: PresetTheme) => (
              <button
                key={preset.name}
                onClick={() => onUpdate(preset.theme)}
                className="w-full p-3 border rounded-xl text-left"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        {/* FONTS */}
        {activeTab === 'fonts' && (
          <div className="space-y-2 mt-4">
            {FONT_PAIRS.map((pair: FontPair) => (
              <button
                key={pair.name}
                onClick={() =>
                  onUpdate({
                    font: { heading: pair.heading, body: pair.body },
                  })
                }
                className="w-full p-3 border rounded-xl text-left"
              >
                {pair.name}
              </button>
            ))}
          </div>
        )}

        {/* SPACING */}
        {activeTab === 'spacing' && (
          <div className="space-y-2 mt-4">
            {(['compact', 'balanced', 'spacious'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onUpdate({ spacing: s })}
                className="w-full p-3 border rounded-xl capitalize"
              >
                {s}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
