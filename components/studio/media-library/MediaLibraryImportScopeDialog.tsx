'use client';

import type { MediaLibraryCollection } from '@/lib/media/media-library-mutations';

interface MediaLibraryImportScopeDialogProps {
  fileCount: number;
  onSelect: (scope: MediaLibraryCollection) => void;
  onCancel: () => void;
}

export function MediaLibraryImportScopeDialog({
  fileCount,
  onSelect,
  onCancel,
}: MediaLibraryImportScopeDialogProps) {
  const label = fileCount === 1 ? '1 file' : `${fileCount} files`;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-surface-900/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose import library"
    >
      <div className="w-full max-w-sm rounded-xl border border-surface-600 bg-surface-800 shadow-xl p-5">
        <h3 className="text-sm font-semibold text-gray-100">Add to which library?</h3>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          Importing {label}. Choose whether this asset belongs to the current project or the global
          app library (reusable across projects).
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSelect('project')}
            className="w-full text-left px-3 py-2.5 rounded-lg border border-brand-600/40 bg-brand-600/10 hover:bg-brand-600/20 transition-colors"
          >
            <div className="text-xs font-semibold text-brand-200">Project library</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Saved with this project — backdrop plates, baked frames, shot outputs
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSelect('global')}
            className="w-full text-left px-3 py-2.5 rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 transition-colors"
          >
            <div className="text-xs font-semibold text-gray-200">Global library</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              App-level assets you can reuse in any project
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="mt-3 w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function importDropHint(scopeFilter: 'all' | MediaLibraryCollection): string {
  if (scopeFilter === 'project') return 'Drop to import into Project library';
  if (scopeFilter === 'global') return 'Drop to import into Global library';
  return 'Drop to import — choose Project or Global next';
}
