'use client';

import {
  SETTINGS_AI_TAB_LABELS,
  SETTINGS_AI_TABS,
  type SettingsAiTab,
} from '@/lib/studio/settings-routes';

interface SettingsAiTabSegmentProps {
  value: SettingsAiTab;
  onChange: (tab: SettingsAiTab) => void;
}

export function SettingsAiTabSegment({ value, onChange }: SettingsAiTabSegmentProps) {
  return (
    <div
      className="frame-view-segment settings-ai-tab-segment flex items-center gap-1 shrink-0"
      role="tablist"
      aria-label="AI settings section"
    >
      {SETTINGS_AI_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={value === tab}
          className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {SETTINGS_AI_TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}