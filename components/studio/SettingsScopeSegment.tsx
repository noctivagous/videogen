'use client';

import { Folder, Settings, Sparkles } from 'lucide-react';
import {
  SETTINGS_SECTION_LABELS,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from '@/lib/studio/settings-routes';

const SECTION_ICONS: Record<SettingsSection, typeof Settings> = {
  app: Settings,
  project: Folder,
  ai: Sparkles,
};

interface SettingsScopeSegmentProps {
  value: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

export function SettingsScopeSegment({ value, onChange }: SettingsScopeSegmentProps) {
  return (
    <div
      className="frame-view-segment settings-scope-segment flex items-center gap-1 shrink-0"
      role="tablist"
      aria-label="Settings section"
    >
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section];
        return (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={value === section}
            className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === section ? 'active' : ''}`}
            onClick={() => onChange(section)}
          >
            <Icon className="w-3 h-3" aria-hidden />
            {SETTINGS_SECTION_LABELS[section]}
          </button>
        );
      })}
    </div>
  );
}