'use client';

import { AppFeatureChecklistSection } from '@/components/studio/AppFeatureChecklistSection';

export function SettingsAppContent() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-surface-700">
        <h2 className="font-semibold text-lg">App settings</h2>
        <p className="text-sm text-gray-400 mt-1">
          Studio-wide preferences and feature readiness. Keyboard shortcuts, launcher layout, and UI defaults will expand here.
        </p>
      </div>

      <AppFeatureChecklistSection />
    </div>
  );
}