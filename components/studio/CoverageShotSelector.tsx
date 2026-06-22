'use client';

import { Select } from '@/components/ui/Select';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { nextCoverageShotId } from '@/lib/studio/coverage-shot-settings';
import { formatShotSettingsLabel } from '@/lib/studio/shot-display';
import { getSetupBackdrop } from '@/lib/studio/resolved-shot';
import { useStudioStore } from '@/store/useStudioStore';

const NEW_SHOT_DUP = '__new_shot_dup__';
const NEW_SHOT_BLANK = '__new_shot_blank__';

export function CoverageShotSelector() {
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const selectCoverageShot = useStudioStore((s) => s.selectCoverageShot);
  const addCoverageShot = useStudioStore((s) => s.addCoverageShot);

  const setup = setups.find((s) => s.id === currentSetupId) ?? setups[0];
  if (!setup) return null;

  const coverageShots = setup.shots;
  const activeId = coverageShots.some((s) => s.id === currentCoverageShotId)
    ? currentCoverageShotId
    : coverageShots[0]?.id;

  const handleChange = (value: string) => {
    if (value === NEW_SHOT_DUP) {
      const id = nextCoverageShotId(setups);
      addCoverageShot('duplicate');
      selectCoverageShot(id);
      return;
    }
    if (value === NEW_SHOT_BLANK) {
      const id = nextCoverageShotId(setups);
      addCoverageShot('blank');
      selectCoverageShot(id);
      return;
    }
    selectCoverageShot(Number(value));
  };

  return (
    <Select
      label="Shot"
      labelClassName="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1 ml-1"
      value={String(activeId ?? '')}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs py-1.5"
      {...uiSectionProps(UI_SECTIONS.studioCoverageShotTabs)}
    >
      {coverageShots.map((coverage) => {
        const backdrop = getSetupBackdrop(setup, coverage.backdropId);
        const framing = formatShotSettingsLabel(coverage.camera);
        const detail = [framing, backdrop?.label].filter(Boolean).join(' · ');
        return (
          <option key={coverage.id} value={coverage.id} title={detail}>
            {detail ? `${coverage.name} — ${detail}` : coverage.name}
          </option>
        );
      })}
      <option disabled>──────────</option>
      <option value={NEW_SHOT_DUP}>+ New shot (duplicate current)</option>
      <option value={NEW_SHOT_BLANK}>+ New shot (blank)</option>
    </Select>
  );
}
