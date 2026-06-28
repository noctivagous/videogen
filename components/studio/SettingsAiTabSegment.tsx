'use client';

import { Building2, Grid2x2 } from 'lucide-react';
import {
  SETTINGS_AI_TAB_LABELS,
  SETTINGS_AI_TABS,
  type SettingsAiTab,
} from '@/lib/studio/settings-routes';

const TAB_ICONS: Record<SettingsAiTab, typeof Grid2x2> = {
  'model-categories': Grid2x2,
  providers: Building2,
};

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
      {SETTINGS_AI_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab];
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={value === tab}
            className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === tab ? 'active' : ''}`}
            onClick={() => onChange(tab)}
          >
            <Icon className="w-3 h-3" aria-hidden />
            {SETTINGS_AI_TAB_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}