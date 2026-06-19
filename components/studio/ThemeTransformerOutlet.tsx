'use client';

import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useThemeTransformConnectorContext } from '@/components/studio/ThemeTransformConnectorProvider';
import { useStudioStore } from '@/store/useStudioStore';

export function ThemeTransformerOutlet() {
  const { outletRef, startDrag } = useThemeTransformConnectorContext();
  const shot = useStudioStore((s) => {
    const list = s.shots;
    return list.find((item) => item.id === s.currentShot) || list[0];
  });

  const linkedCount = shot?.themeTransformLinked?.filter(Boolean).length ?? 0;
  const readyCount =
    shot?.themeTransformStatus?.filter((status, i) => status === 'ready' && shot.themeTransformLinked?.[i])
      .length ?? 0;

  return (
    <div className="theme-transform-outlet-section mb-4">
      <div className="theme-transform-outlet-section__controls">
        <button
          type="button"
          ref={outletRef}
          className="theme-transform-outlet"
          title="Drag to an image reference to apply this color grade"
          aria-label="Theme Transformer outlet — drag to image reference"
          onPointerDown={startDrag}
          {...uiSectionProps(UI_SECTIONS.studioThemeTransformerOutlet)}
        />
        {linkedCount > 0 && (
          <span className="theme-transform-outlet-section__status">
            {readyCount}/{linkedCount} linked
          </span>
        )}
      </div>
      <p className="theme-transform-outlet-section__hint text-[10px] text-gray-500 leading-snug mt-2">
        Drag from the outlet to an image reference in the preview to apply the color grade and look settings.
      </p>
    </div>
  );
}