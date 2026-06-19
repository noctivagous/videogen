import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import {
  LOOK_CATEGORIES,
  LOOK_CATEGORY_LABELS,
  LOOK_RECIPES,
  recipesForCategory,
  type LookCategory,
} from '@/lib/constants/look-recipes';

export function lookCategoryThumbnail(category: LookCategory): string {
  return `/stock/looks/categories/${category}.jpg`;
}

export function lookRecipeThumbnail(recipeId: string): string {
  return `/stock/looks/${recipeId}.jpg`;
}

export const LOOK_CATEGORY_OPTIONS: VisualDropdownOption<LookCategory>[] = LOOK_CATEGORIES.map(
  (category) => ({
    value: category,
    label: LOOK_CATEGORY_LABELS[category],
    shortLabel: LOOK_CATEGORY_LABELS[category],
    imageUrl: lookCategoryThumbnail(category),
  }),
);

export function lookRecipeOptions(category: LookCategory): VisualDropdownOption<string>[] {
  return recipesForCategory(category).map((recipe) => ({
    value: recipe.id,
    label: recipe.label,
    shortLabel: recipe.label,
    imageUrl: lookRecipeThumbnail(recipe.id),
  }));
}

export const LOOK_RECIPE_NONE = '__none__';

export function lookRecipeDropdownOptions(
  category: LookCategory,
): VisualDropdownOption<string>[] {
  return [
    { value: LOOK_RECIPE_NONE, label: 'None', shortLabel: 'None' },
    ...lookRecipeOptions(category),
  ];
}

/** All recipe ids — useful for batch generation scripts. */
export const ALL_LOOK_RECIPE_IDS = LOOK_RECIPES.map((r) => r.id);