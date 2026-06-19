'use client';

import { useState } from 'react';
import { VisualDropdown } from '@/components/ui/VisualDropdown';
import {
  LOOK_CATEGORY_OPTIONS,
  LOOK_RECIPE_NONE,
  lookRecipeDropdownOptions,
} from '@/lib/constants/look-options';
import {
  getLookRecipe,
  recipesForCategory,
  type LookCategory,
} from '@/lib/constants/look-recipes';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

export function LookLibraryPanel() {
  const palette = useStudioStore((s) => s.lighting.colorPalette);
  const applyLookRecipe = useStudioStore((s) => s.applyLookRecipe);
  const clearLookRecipe = useStudioStore((s) => s.clearLookRecipe);
  const [browseCategory, setBrowseCategory] = useState<LookCategory>(LOOK_CATEGORY_OPTIONS[0].value);

  const activeId = palette.activeLookRecipeId;
  const activeRecipe = getLookRecipe(activeId);
  const resolvedCategory = activeRecipe?.category ?? browseCategory;

  const recipeOptions = lookRecipeDropdownOptions(resolvedCategory);

  const selectedRecipeValue =
    activeId && recipesForCategory(resolvedCategory).some((r) => r.id === activeId)
      ? activeId
      : LOOK_RECIPE_NONE;

  return (
    <div className="mb-5 pb-5 border-b border-surface-700" {...uiSectionProps(UI_SECTIONS.studioLookLibrary)}>
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">Look Library</h3>
        {activeId && (
          <span className="ml-auto text-[10px] uppercase tracking-wider text-brand-400/80">Preset active</span>
        )}
      </div>

      <div className="space-y-3">
        <VisualDropdown
          label="Category"
          value={resolvedCategory}
          onChange={(c: LookCategory) => setBrowseCategory(c)}
          options={LOOK_CATEGORY_OPTIONS}
          triggerVariant="thumbnailRight"
          menuVariant="grid"
          size="sm"
          menuColumns={2}
          cellWidth={96}
          cellHeight={88}
          uiSection={uiSectionProps(UI_SECTIONS.studioLookLibraryCategory)}
        />

        <VisualDropdown
          label="Look"
          value={selectedRecipeValue}
          onChange={(id: string) => {
            if (id === LOOK_RECIPE_NONE) clearLookRecipe();
            else applyLookRecipe(id);
          }}
          options={recipeOptions}
          triggerVariant="thumbnailRight"
          menuVariant="grid"
          size="sm"
          menuColumns={2}
          cellWidth={96}
          cellHeight={88}
          uiSection={uiSectionProps(UI_SECTIONS.studioLookLibraryRecipe)}
        />
      </div>
    </div>
  );
}