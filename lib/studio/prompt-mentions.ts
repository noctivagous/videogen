import { normalizeReferenceRole } from '@/lib/constants/camera';
import { getReferenceSlotLabel, isCinematographyRefs } from '@/lib/studio/reference-slots';
import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';
import type { LightingSettings, ReferenceRole, Shot } from '@/lib/types/studio';

export interface PromptMentionOption {
  id: string;
  token: string;
  label: string;
  url: string;
  /** 1-based slot label (@Image1 = slot 0). */
  imageIndex: number;
  slotIndex: number;
}

/** @ImageN is tied to reference slot N (1-based); only slots with an image appear. */
export function buildPromptMentionOptions(shot: Shot | undefined): PromptMentionOption[] {
  if (!shot) return [];

  const options: PromptMentionOption[] = [];
  const cinematography = isCinematographyRefs(shot);

  for (let i = 0; i < shot.references.length; i++) {
    const url = effectiveReferenceUrl(shot, i, shot.lighting);
    if (!url) continue;

    const role = normalizeReferenceRole(shot.referenceRoles[i] ?? 'None');
    if (cinematography && role === 'None') continue;

    const imageIndex = i + 1;
    options.push({
      id: `Image${imageIndex}`,
      token: `@Image${imageIndex}`,
      label: getReferenceSlotLabel(shot, i, role),
      url,
      imageIndex,
      slotIndex: i,
    });
  }
  return options;
}

/** Filled reference slots in slot order — used for API send list (compacted). */
export function buildSlotReferenceRefs(
  shot: Shot | undefined,
  lighting?: LightingSettings,
): Array<{ role: ReferenceRole; url: string; slotIndex: number }> {
  if (!shot) return [];

  const resolvedLighting = lighting ?? shot.lighting;
  const cinematography = isCinematographyRefs(shot);
  const refs: Array<{ role: ReferenceRole; url: string; slotIndex: number }> = [];
  for (let i = 0; i < shot.references.length; i++) {
    const url = effectiveReferenceUrl(shot, i, resolvedLighting);
    if (!url) continue;

    const role = normalizeReferenceRole(shot.referenceRoles[i] ?? 'None');
    if (cinematography && role === 'None') continue;

    refs.push({ role, url, slotIndex: i });
  }
  return refs;
}

/** Map slot-based @ImageN to 1-based API image index in the compacted send list. */
export function slotImageNumberToApiIndex(
  shot: Shot | undefined,
  imageNumber: number,
): number | null {
  if (!shot || imageNumber < 1) return null;

  const slotIndex = imageNumber - 1;
  const filled = buildSlotReferenceRefs(shot);
  const apiIndex = filled.findIndex((r) => r.slotIndex === slotIndex);
  if (apiIndex < 0) return null;
  return apiIndex + 1;
}

const USER_MENTION_PATTERN = /@image(\d+)/gi;
const API_IMAGE_TAG_PATTERN = /<IMAGE_\d+>/i;

export function hasPromptImageReferences(text: string): boolean {
  return API_IMAGE_TAG_PATTERN.test(text) || /@image\d+/i.test(text);
}

/** Expand slot-based @ImageN tokens to provider-native syntax before API calls. */
export function expandPromptMentions(
  text: string,
  shot: Shot | undefined,
  providerId: string,
  opts?: { xaiImageIndexOffset?: number },
): string {
  if (!text || !shot) return text;

  return text.replace(USER_MENTION_PATTERN, (match, indexStr: string) => {
    const imageNumber = parseInt(indexStr, 10);
    const apiIndex = slotImageNumberToApiIndex(shot, imageNumber);
    if (!apiIndex) return match;

    if (providerId === 'xai') {
      const offset = opts?.xaiImageIndexOffset ?? 0;
      return `<IMAGE_${apiIndex + offset}>`;
    }
    return match;
  });
}