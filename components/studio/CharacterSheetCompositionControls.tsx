'use client';

import { VisualDropdown } from '@/components/ui/VisualDropdown';
import { COVERAGE_OPTIONS } from '@/lib/constants/coverage-options';
import { SUBJECT_COUNT_OPTIONS } from '@/lib/constants/subject-count-options';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

const CAMERA_PANEL_LABEL = 'camera-panel-label';

export function CharacterSheetCompositionControls() {
  const camera = useStudioStore((s) => s.camera);
  const handleCameraCompositionChange = useStudioStore((s) => s.handleCameraCompositionChange);
  const showCoverage = camera.subjectCount === '1s';

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
    </div>
  );
}
