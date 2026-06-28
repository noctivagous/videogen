'use client';

import {
  SETTINGS_SECTION_LABELS,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from '@/lib/studio/settings-routes';

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
      {SETTINGS_SECTIONS.map((section) => (
        <button
          key={section}
          type="button"
          role="tab"
          aria-selected={value === section}
          className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === section ? 'active' : ''}`}
          onClick={() => onChange(section)}
        >
          {SETTINGS_SECTION_LABELS[section]}
        </button>
      ))}
    </div>
  );
}