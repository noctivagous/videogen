'use client';

import { useRef, useState } from 'react';
import { ReferenceImageViewerModal } from '@/components/studio/ReferenceImageViewerModal';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import { getSetupBackdrop } from '@/lib/studio/resolved-shot';
import { invalidateCoverageForBackdrop } from '@/lib/studio/setup-invalidation';
import { getTimelineShots } from '@/lib/studio/store-hierarchy';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioStore } from '@/store/useStudioStore';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function SetupBackdropPanel() {
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const addOrSelectManualBackdropForCurrentShot = useStudioStore((s) => s.addOrSelectManualBackdropForCurrentShot);
  const clearCurrentShotBackdrop = useStudioStore((s) => s.clearCurrentShotBackdrop);
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const selectMediaLibraryItem = useStudioStore((s) => s.selectMediaLibraryItem);
  const navigateToPanel = useNavigateToStudioPanel();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const [viewerBackdrop, setViewerBackdrop] = useState<{ url: string; label: string } | null>(null);

  const setup = setups.find((s) => s.id === currentSetupId) ?? setups[0];
  if (!setup) return null;

  const activeCoverage = setup.shots.find((s) => s.id === currentCoverageShotId) ?? setup.shots[0];
  const activeBackdropId = activeCoverage?.backdropId;

  const selectBackdropForShot = (backdropId: string) => {
    if (!activeCoverage) return;
    const prevBackdropId = activeCoverage.backdropId;
    useStudioStore.setState((s) => {
      let setups = s.setups.map((item) => {
        if (item.id !== setup.id) return item;
        return {
          ...item,
          shots: item.shots.map((shot) =>
            shot.id === activeCoverage.id ? { ...shot, backdropId } : shot,
          ),
        };
      });
      // Switching plates invalidates the current coverage's bake (backdrop changed).
      if (backdropId !== prevBackdropId) {
        setups = invalidateCoverageForBackdrop(setups, setup.id, backdropId);
      }
      return { setups };
    });
  };

  const handleAddPlate = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    const label = file.name.replace(/\.[^/.]+$/, '').trim() || `Plate ${setup.backdrops.length + 1}`;
    addOrSelectManualBackdropForCurrentShot(dataUrl, label);
  };

  const handleBackdropDrop = async (dataTransfer: DataTransfer) => {
    const file = dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      await handleAddPlate(file);
      return;
    }
    const uri = dataTransfer.getData('text/uri-list').split('\n').find((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#');
    });
    if (uri && (uri.startsWith('data:image/') || uri.startsWith('blob:') || /^https?:\/\//.test(uri))) {
      addOrSelectManualBackdropForCurrentShot(uri);
    }
  };

  const handleDeletePlate = (backdropId: string) => {
    selectBackdropForShot(backdropId);
    clearCurrentShotBackdrop();
  };

  const replaceBackdropPlate = (backdropId: string, nextUrl: string) => {
    if (!setup) return;
    useStudioStore.setState((s) => {
      const setups = s.setups.map((entry) => {
        if (entry.id !== setup.id) return entry;
        const changed = entry.backdrops.some((backdrop) => backdrop.id === backdropId && backdrop.url !== nextUrl);
        const nextBackdrops = entry.backdrops.map((backdrop) =>
          backdrop.id === backdropId
            ? { ...backdrop, url: nextUrl }
            : backdrop,
        );
        const nextEntry = { ...entry, backdrops: nextBackdrops };
        return changed ? invalidateCoverageForBackdrop([nextEntry], nextEntry.id, backdropId)[0] : nextEntry;
      });
      return {
        setups,
        shots: getTimelineShots(setups),
      };
    });
  };

  const handleReplaceBackdrop = async (backdropId: string, file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await readFileAsDataUrl(file);
    replaceBackdropPlate(backdropId, dataUrl);
  };

  const openViewerItemInMediaLibrary = () => {
    if (!viewerBackdrop?.url) return;
    const match = [...mediaLibrary, ...globalMediaLibrary].find((asset) => (
      asset.url === viewerBackdrop.url || resolveReferenceDisplayUrl(asset.url) === viewerBackdrop.url
    ));
    if (match) {
      selectMediaLibraryItem(match.id);
    }
    setViewerBackdrop(null);
    navigateToPanel('media-library');
  };

  return (
    <div
      className="rounded-lg border border-surface-600/80 bg-surface-800/40 p-3 space-y-2"
      {...uiSectionProps(UI_SECTIONS.studioSetupBackdropPanel)}
      onDragOver={(e) => {
        const types = Array.from(e.dataTransfer.types);
        if (!types.includes('Files') && !types.includes('text/uri-list')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        void handleBackdropDrop(e.dataTransfer);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
          Backdrop plates
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-semibold uppercase tracking-wide text-brand-400 hover:text-brand-300"
        >
          + Add plate
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleAddPlate(file);
            e.target.value = '';
          }}
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
      {setup.backdrops.map((backdrop) => {
          const selected = backdrop.id === activeBackdropId;
          const displayUrl = backdrop.url ? resolveReferenceDisplayUrl(backdrop.url) : null;
          return (
            <div
              key={backdrop.id}
              className={`relative flex-shrink-0 w-24 rounded-lg border-2 overflow-hidden group ${
                selected ? 'border-brand-500' : 'border-surface-600 hover:border-brand-500/50'
              }`}
            >
              <button
                type="button"
                className="block w-full aspect-video bg-surface-700"
                onClick={() => {
                  selectBackdropForShot(backdrop.id);
                  if (displayUrl) {
                    setViewerBackdrop({ url: displayUrl, label: backdrop.label });
                  }
                }}
                title={`Use ${backdrop.label} for active shot`}
              >
                {displayUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-500">
                    Empty
                  </div>
                )}
              </button>
              <button
                type="button"
                className="reference-replace"
                title={`Replace ${backdrop.label}`}
                aria-label={`Replace ${backdrop.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  replaceFileInputsRef.current[backdrop.id]?.click();
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </button>
              <input
                ref={(el) => { replaceFileInputsRef.current[backdrop.id] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleReplaceBackdrop(backdrop.id, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <div className="px-1.5 py-1 bg-surface-900/90 text-[9px] text-gray-300 truncate">
                {backdrop.label}
              </div>
              {selected && (
                <button
                  type="button"
                  onClick={() => handleDeletePlate(backdrop.id)}
                  className="absolute top-1 right-1 p-0.5 rounded bg-black/65 text-gray-300 hover:text-red-400 opacity-80 hover:opacity-100 transition-opacity"
                  title="Clear backdrop"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m4 0V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0h8" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
      {activeCoverage && (
        <p className="text-[10px] text-gray-500">
          Active shot uses {getSetupBackdrop(setup, activeCoverage.backdropId)?.label ?? 'plate'}.
        </p>
      )}
      <ReferenceImageViewerModal
        open={viewerBackdrop !== null}
        imageUrl={viewerBackdrop?.url ?? ''}
        label={viewerBackdrop?.label ?? 'Backdrop plate'}
        onClose={() => setViewerBackdrop(null)}
        onOpenInMediaLibrary={openViewerItemInMediaLibrary}
      />
    </div>
  );
}
