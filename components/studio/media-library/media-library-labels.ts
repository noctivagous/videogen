import { getWorkflowLabel } from '@/lib/constants/workflows';
import { getMediaAssetTypeLabel } from '@/lib/media/media-library-query';
import type { MediaAsset, MediaWorkflowOrigin } from '@/lib/types/media-library';
import { formatColorPaletteGroupAssetName } from '@/lib/media/color-palette-group';

export function formatMediaAssetOrigin(origin: MediaWorkflowOrigin | undefined): string {
  if (!origin) return '—';
  if (origin === 'upload' || origin === 'generated') {
    return origin === 'upload' ? 'Upload' : 'Generated';
  }
  return getWorkflowLabel(origin);
}

export function formatMediaAssetSummary(asset: MediaAsset): string {
  if (asset.type === 'color-palette-group') {
    return formatColorPaletteGroupAssetName(asset);
  }
  return getMediaAssetTypeLabel(asset.type);
}

export function truncateId(id: string, length = 12): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}…`;
}
