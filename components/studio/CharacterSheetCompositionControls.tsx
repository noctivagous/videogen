'use client';

import { useMemo } from 'react';
import { VisualDropdown } from '@/components/ui/VisualDropdown';
import { getArrangementOptionsForSubjectCount } from '@/lib/constants/arrangement-options';
import { COVERAGE_OPTIONS } from '@/lib/constants/coverage-options';
import { CROWD_DENSITY_OPTIONS } from '@/lib/constants/crowd-density-options';
import { SUBJECT_COUNT_OPTIONS } from '@/lib/constants/subject-count-options';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { SubjectArrangement, SubjectCount } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

const CAMERA_PANEL_LABEL = 'camera-panel-label';

export interface CharacterSheetCompositionControlsProps {
  /** When true, omits crowd-specific text fields (shown in SubjectsFieldset instead). */
  compactCrowd?: boolean;
}

export function CharacterSheetCompositionControls({
  compactCrowd = false,
}: CharacterSheetCompositionControlsProps) {
  const camera = useStudioStore((s) => s.camera);
  const handleCameraCompositionChange = useStudioStore((s) => s.handleCameraCompositionChange);
  const setCrowdTypePrompt = useStudioStore((s) => s.setCrowdTypePrompt);
  const crowdTypePrompt = useStudioStore((s) => {
    const shot = s.shots.find((sh) => sh.id === s.currentShot);
    return shot?.crowdTypePrompt ?? '';
  });

  const showCoverage = camera.subjectCount === '1s';
  const showArrangement = ['2s', '3s', 'group'].includes(camera.subjectCount);
  const showCrowdControls = camera.subjectCount === 'crowd';
  const arrangementOptions = useMemo(
    () => getArrangementOptionsForSubjectCount(camera.subjectCount),
    [camera.subjectCount],
  );

  const chainConnector = (
    <div className="camera-param-chain__connector" aria-hidden>
      <svg
        className="camera-param-chain__arrow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </div>
  );

  return (
    <div className="character-sheet-composition-controls camera-param-chain">
      <VisualDropdown
        label="Subject Count"
        labelClassName={CAMERA_PANEL_LABEL}
        value={camera.subjectCount}
        onChange={(subjectCount) => handleCameraCompositionChange('subjectCount', { subjectCount })}
        options={SUBJECT_COUNT_OPTIONS}
        triggerVariant="thumbnailRight"
        menuVariant="grid"
        size="md"
        menuColumns={2}
        cellWidth={96}
        cellHeight={88}
        uiSection={uiSectionProps(UI_SECTIONS.studioCameraSubjectCount)}
      />

      {showCoverage && (
        <>
          {chainConnector}
          <VisualDropdown
            label="Coverage"
            labelClassName={CAMERA_PANEL_LABEL}
            value={camera.coverage}
            onChange={(coverage) => handleCameraCompositionChange('coverage', { coverage })}
            options={COVERAGE_OPTIONS}
            triggerVariant="thumbnailRight"
            menuVariant="grid"
            size="md"
            menuColumns={2}
            cellWidth={96}
            cellHeight={88}
            uiSection={uiSectionProps(UI_SECTIONS.studioCameraCoverage)}
          />
        </>
      )}

      {showArrangement && arrangementOptions.length > 0 && (
        <>
          {chainConnector}
          <VisualDropdown
            label="Arrangement"
            labelClassName={CAMERA_PANEL_LABEL}
            value={camera.arrangement}
            onChange={(arrangement) =>
              handleCameraCompositionChange('arrangement', { arrangement: arrangement as SubjectArrangement })
            }
            options={arrangementOptions}
            triggerVariant="thumbnailRight"
            menuVariant="grid"
            size="md"
            menuColumns={2}
            cellWidth={96}
            cellHeight={88}
            uiSection={uiSectionProps(UI_SECTIONS.studioCameraCoverage)}
          />
        </>
      )}

      {showCrowdControls && (
        <>
          {chainConnector}
          <VisualDropdown
            label="Crowd Density"
            labelClassName={CAMERA_PANEL_LABEL}
            value={camera.crowdDensity}
            onChange={(crowdDensity) => handleCameraCompositionChange('crowdDensity', { crowdDensity })}
            options={CROWD_DENSITY_OPTIONS}
            triggerVariant="thumbnailRight"
            menuVariant="list"
            size="md"
            uiSection={uiSectionProps(UI_SECTIONS.studioCameraCoverage)}
          />
          {!compactCrowd && (
            <>
              {chainConnector}
              <label className="flex flex-col gap-1">
                <span className={CAMERA_PANEL_LABEL}>Crowd Type</span>
                <input
                  type="text"
                  className="bg-surface-800 border border-surface-600 rounded px-2 py-1 text-[11px] text-gray-200"
                  placeholder="e.g. concert audience, street market"
                  value={crowdTypePrompt}
                  onChange={(e) => setCrowdTypePrompt(e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={camera.heroSubjectsEnabled}
                  onChange={(e) =>
                    handleCameraCompositionChange('heroSubjectsEnabled', {
                      heroSubjectsEnabled: e.target.checked,
                    })
                  }
                  className="rounded border-surface-600"
                />
                <span className="text-[10px] text-gray-400">Hero Subjects (recognizable foreground characters)</span>
              </label>
            </>
          )}
        </>
      )}
    </div>
  );
}
