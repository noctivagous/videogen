'use client';

import { useRef } from 'react';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import { nextBackdropId } from '@/lib/studio/coverage-shot-settings';
import { getSetupBackdrop } from '@/lib/studio/resolved-shot';
import { invalidateCoverageForBackdrop } from '@/lib/studio/setup-invalidation';
import type { SetupBackdrop } from '@/lib/types/studio';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setup = setups.find((s) => s.id === currentSetupId) ?? setups[0];
  if (!setup) return null;

  const activeCoverage = setup.shots.find((s) => s.id === currentCoverageShotId) ?? setup.shots[0];
  const activeBackdropId = activeCoverage?.backdropId;

  const patchSetup = (backdrops: SetupBackdrop[]) => {
    useStudioStore.setState((s) => ({
      setups: s.setups.map((item) =>
        item.id === setup.id ? { ...item, backdrops } : item,
      ),
    }));
  };

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
    const id = nextBackdropId(setups);
    const label = `Plate ${setup.backdrops.length + 1}`;
    patchSetup([
      ...setup.backdrops,
      {
        id,
        label,
        url: dataUrl,
        backdropFramingByAspect: {},
        backdropCropsByAspect: {},
        backdropCropStatusByAspect: {},
      },
    ]);
    selectBackdropForShot(id);
  };

  const handleDeletePlate = (backdropId: string) => {
    const inUse = setup.shots.some((shot) => shot.backdropId === backdropId);
    if (inUse && setup.backdrops.length <= 1) {
      useStudioStore.getState().showToast('Cannot delete the only backdrop plate', 'error');
      return;
    }
    if (inUse) {
      useStudioStore.getState().showToast('Reassign shots before deleting this plate', 'error');
      return;
    }
    patchSetup(setup.backdrops.filter((b) => b.id !== backdropId));
  };

  return (
    <div
      className="rounded-lg border border-surface-600/80 bg-surface-800/40 p-3 space-y-2"
      {...uiSectionProps(UI_SECTIONS.studioSetupBackdropPanel)}
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
                onClick={() => selectBackdropForShot(backdrop.id)}
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
              <div className="px-1.5 py-1 bg-surface-900/90 text-[9px] text-gray-300 truncate">
                {backdrop.label}
              </div>
              {setup.backdrops.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeletePlate(backdrop.id)}
                  className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete plate"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
    </div>
  );
}
