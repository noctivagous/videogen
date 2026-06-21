'use client';

import { VisualDropdown } from '@/components/ui/VisualDropdown';
import { FIELD_SIZE_OPTIONS } from '@/lib/constants/field-size-options';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

const CAMERA_PANEL_LABEL = 'camera-panel-label';

export function MannequinPlacementControls() {
  const camera = useStudioStore((s) => s.camera);
  const setCamera = useStudioStore((s) => s.setCamera);

  return (
    <div className="mannequin-placement-controls flex flex-col gap-3">
      <VisualDropdown
        label="Field Size"
        labelClassName={CAMERA_PANEL_LABEL}
        value={camera.fieldSize}
        onChange={(fieldSize) => setCamera({ fieldSize })}
        options={FIELD_SIZE_OPTIONS}
        triggerVariant="thumbnailRight"
        menuVariant="grid"
        size="md"
        menuColumns={2}
        cellWidth={96}
        cellHeight={88}
        uiSection={uiSectionProps(UI_SECTIONS.studioCameraFieldSize)}
      />
    </div>
  );
}
