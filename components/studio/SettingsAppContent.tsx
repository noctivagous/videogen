'use client';

export function SettingsAppContent() {
  return (
    <div className="glass rounded-3xl p-6 border border-surface-700">
      <h2 className="font-semibold text-lg">App settings</h2>
      <p className="text-sm text-gray-400 mt-1">
        Studio-wide preferences such as keyboard shortcuts, launcher layout, and UI defaults will live here.
      </p>
    </div>
  );
}