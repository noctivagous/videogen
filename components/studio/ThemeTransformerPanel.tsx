'use client';

import type { RefObject } from 'react';
import { ColorPalettePreviewTable } from '@/components/studio/ColorPalettePreviewTable';
import { getLookRecipe } from '@/lib/constants/look-recipes';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { buildThemeTransformLookPrompt, needsThemeTransformer } from '@/lib/studio/theme-transform';
import { useStudioStore } from '@/store/useStudioStore';

export interface ThemeTransformerPanelProps {
  outletRef?: RefObject<HTMLButtonElement | null>;
  onOutletPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
}

export function ThemeTransformerPanel({ outletRef, onOutletPointerDown }: ThemeTransformerPanelProps) {
  const lighting = useStudioStore((s) => s.lighting);
  const shot = useStudioStore((s) => {
    const list = s.shots;
    return list.find((item) => item.id === s.currentShot) || list[0];
  });

  if (!needsThemeTransformer(lighting)) return null;

  const activeRecipe = getLookRecipe(lighting.colorPalette?.activeLookRecipeId ?? null);
  const linkedCount = shot?.themeTransformLinked?.filter(Boolean).length ?? 0;
  const readyCount =
    shot?.themeTransformStatus?.filter((status, i) => status === 'ready' && shot.themeTransformLinked?.[i])
      .length ?? 0;
  const transformPrompt = buildThemeTransformLookPrompt(lighting);

  return (
    <div
      className="theme-transformer-panel"
      {...uiSectionProps(UI_SECTIONS.studioThemeTransformer)}
    >
      <div className="theme-transformer-panel__header">
        <svg className="w-4 h-4 shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <span className="theme-transformer-panel__title">Theme Transformer</span>
        {activeRecipe && (
          <span className="theme-transformer-panel__recipe" title={activeRecipe.description}>
            {activeRecipe.label}
          </span>
        )}
      </div>

      <div className="theme-transformer-panel__body">
        <ColorPalettePreviewTable
          palette={lighting.colorPalette}
          transformPrompt={transformPrompt}
          className="theme-transformer-panel__palette"
        />
        <div className="theme-transformer-panel__outlet-wrap">
          <button
            type="button"
            ref={outletRef}
            className="theme-transform-outlet"
            title="Drag to a reference slot to apply this color grade"
            aria-label="Theme Transformer outlet — drag to reference slot"
            onPointerDown={onOutletPointerDown}
            {...uiSectionProps(UI_SECTIONS.studioThemeTransformerOutlet)}
          />
          <span className="theme-transformer-panel__hint">
            {linkedCount > 0
              ? `${readyCount}/${linkedCount} linked`
              : 'Drag to slot'}
          </span>
        </div>
      </div>
    </div>
  );
}