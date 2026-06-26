import type { ModelCategoryId } from '@/lib/constants/model-catalog';

export function getModelCategoryThumbnailUrl(categoryId: ModelCategoryId): string {
  return `/stock/app-styling/model-categories/${categoryId}.svg`;
}
