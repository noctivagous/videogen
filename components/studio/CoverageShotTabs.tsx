'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { formatShotSettingsLabel } from '@/lib/studio/shot-display';
import { getSetupBackdrop } from '@/lib/studio/resolved-shot';
import { useStudioStore } from '@/store/useStudioStore';

type AddCoverageMode = 'duplicate' | 'blank';

export function CoverageShotTabs() {
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const selectCoverageShot = useStudioStore((s) => s.selectCoverageShot);
  const addCoverageShot = useStudioStore((s) => s.addCoverageShot);
  const deleteCoverageShot = useStudioStore((s) => s.deleteCoverageShot);

  const setup = setups.find((s) => s.id === currentSetupId) ?? setups[0];
  if (!setup) return null;

  const coverageShots = setup.shots;

  const handleAdd = (mode: AddCoverageMode) => () => addCoverageShot(mode);

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-1 py-2 border-b border-surface-700/80"
      {...uiSectionProps(UI_SECTIONS.studioCoverageShotTabs)}
    >
      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 shrink-0">
        Shots
      </span>
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
        {coverageShots.map((coverage) => {
          const active = coverage.id === currentCoverageShotId;
          const backdrop = getSetupBackdrop(setup, coverage.backdropId);
          const label = formatShotSettingsLabel(coverage.camera);
          return (
            <div key={coverage.id} className="flex items-center gap-0.5 group">
              <button
                type="button"
                onClick={() => selectCoverageShot(coverage.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors max-w-[12rem] truncate ${
                  active
                    ? 'border-brand-500 bg-brand-500/15 text-brand-200'
                    : 'border-surface-600 bg-surface-800/60 text-gray-400 hover:border-brand-500/50 hover:text-gray-200'
                }`}
                title={`${coverage.name} · ${label}${backdrop?.label ? ` · ${backdrop.label}` : ''}`}
              >
                {coverage.name}
              </button>
              {coverageShots.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteCoverageShot(coverage.id)}
                  className="p-1 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete shot"
                  aria-label={`Delete ${coverage.name}`}
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
      <div className="flex items-center rounded-lg border border-surface-600/80 bg-surface-800/40 overflow-hidden shrink-0">
        <button
          type="button"
          onClick={handleAdd('duplicate')}
          className="text-[10px] text-brand-400 hover:text-brand-300 hover:bg-surface-700/60 font-semibold uppercase tracking-wide px-2 py-1 transition-colors border-r border-surface-600/80"
          title="Add shot — duplicate current framing"
        >
          + Dup
        </button>
        <button
          type="button"
          onClick={handleAdd('blank')}
          className="text-[10px] text-brand-400 hover:text-brand-300 hover:bg-surface-700/60 font-semibold uppercase tracking-wide px-2 py-1 transition-colors"
          title="Add blank shot in this setup"
        >
          + Blank
        </button>
      </div>
    </div>
  );
}
