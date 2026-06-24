import { normalizeReferenceRole } from '@/lib/constants/camera';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import { getBackdropSlotIndex } from '@/lib/studio/backdrop-framing';
import { getReferenceSlotLabel, isCinematographyRefs } from '@/lib/studio/reference-slots';
import { getSubjectChecklistSlotIndices } from '@/lib/studio/subject-sheet-slots';
import { buildWorkflowGenerationRefs } from '@/lib/studio/workflow';
import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';
import type {
  AspectRatio,
  Character,
  LightingSettings,
  Location,
  ReferenceRole,
  Setup,
  Shot,
} from '@/lib/types/studio';

export interface PromptMentionOption {
  id: string;
  token: string;
  label: string;
  url: string;
  /** 1-based slot label (@Image1 = slot 0). */
  imageIndex: number;
  slotIndex: number;
}

interface PromptMentionContext {
  setup?: Setup;
  characters?: Character[];
  locations?: Location[];
}

function pushUniqueMentionOption(
  options: PromptMentionOption[],
  seen: Set<string>,
  option: PromptMentionOption,
) {
  const key = option.token.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  options.push(option);
}

function buildBackdropSourceLabel(
  shot: Shot,
  imageIndex: number,
  context?: PromptMentionContext,
): string {
  const setup = context?.setup;
  const location = context?.locations?.find((entry) => entry.id === setup?.locationId);
  const coverage = setup?.shots.find((entry) => entry.id === shot.id);
  const plate = location?.plates.find((entry) => entry.id === coverage?.backdropId);
  if (location && plate) {
    return `Location > ${location.name} > ${plate.label}`;
  }
  if (location) {
    return `Location > ${location.name} > Backdrop Plate`;
  }
  return `Location > Backdrop Plate (Image${imageIndex})`;
}

function buildCharacterSourceLabel(
  imageIndex: number,
  subjectOrdinal: number,
  context?: PromptMentionContext,
): string {
  const setup = context?.setup;
  const characterId = setup?.characterSlots?.[subjectOrdinal];
  const sheetId = setup?.characterSheetSlots?.[subjectOrdinal];
  const character = context?.characters?.find((entry) => entry.id === characterId);
  const sheet = character?.sheets.find((entry) => entry.id === sheetId) ?? character?.sheets[0];
  if (character && sheet) {
    return `Character > ${character.name} > ${sheet.label ?? `Sheet ${subjectOrdinal + 1}`}`;
  }
  if (character) {
    return `Character > ${character.name} > Character Sheet`;
  }
  return `Character > Manual Character Sheet ${subjectOrdinal + 1} (Image${imageIndex})`;
}

/** @ImageN is tied to reference slot N (1-based); only slots with an image appear. */
export function buildPromptMentionOptions(
  shot: Shot | undefined,
  context?: PromptMentionContext,
): PromptMentionOption[] {
  if (!shot) return [];

  const options: PromptMentionOption[] = [];
  const seenTokens = new Set<string>();
  const cinematography = isCinematographyRefs(shot);
  const backdropSlot = getBackdropSlotIndex(shot);
  const subjectSlots = getSubjectChecklistSlotIndices(shot);
  const subjectOrdinalBySlot = new Map(subjectSlots.map((slot, ordinal) => [slot, ordinal]));

  for (let i = 0; i < shot.references.length; i++) {
    const url = effectiveReferenceUrl(shot, i, shot.lighting);
    if (!url) continue;

    const role = normalizeReferenceRole(shot.referenceRoles[i] ?? 'None');
    if (cinematography && role === 'None') continue;

    const imageIndex = i + 1;
    const imageOption: PromptMentionOption = {
      id: `Image${imageIndex}`,
      token: `@Image${imageIndex}`,
      label: getReferenceSlotLabel(shot, i, role),
      url,
      imageIndex,
      slotIndex: i,
    };
    pushUniqueMentionOption(options, seenTokens, imageOption);

    if (i === backdropSlot && (role === 'Backdrop' || role === 'Depth')) {
      pushUniqueMentionOption(options, seenTokens, {
        ...imageOption,
        id: 'BackdropPlate',
        token: '@BackdropPlate',
        label: buildBackdropSourceLabel(shot, imageIndex, context),
      });
    }

    const subjectOrdinal = subjectOrdinalBySlot.get(i);
    if (subjectOrdinal != null) {
      const characterLabel = buildCharacterSourceLabel(imageIndex, subjectOrdinal, context);
      pushUniqueMentionOption(options, seenTokens, {
        ...imageOption,
        id: `CharacterSheet${subjectOrdinal + 1}`,
        token: `@CharacterSheet${subjectOrdinal + 1}`,
        label: characterLabel,
      });
      if (subjectOrdinal === 0) {
        pushUniqueMentionOption(options, seenTokens, {
          ...imageOption,
          id: 'CharacterSheet',
          token: '@CharacterSheet',
          label: characterLabel,
        });
      }
    }
  }
  return options;
}

/** Filled reference slots in slot order — used for API send list (compacted). */
export function buildSlotReferenceRefs(
  shot: Shot | undefined,
  lighting?: LightingSettings,
  aspectRatio?: AspectRatio,
): Array<{ role: ReferenceRole; url: string; slotIndex: number }> {
  if (!shot) return [];

  const workflowRefs = buildWorkflowGenerationRefs(shot, lighting, aspectRatio);
  if (workflowRefs) return workflowRefs;

  const resolvedLighting = lighting ?? shot.lighting;
  const cinematography = isCinematographyRefs(shot);
  const backdropSlot = getBackdropSlotIndex(shot);
  const refs: Array<{ role: ReferenceRole; url: string; slotIndex: number }> = [];
  for (let i = 0; i < shot.references.length; i++) {
    let url = effectiveReferenceUrl(shot, i, resolvedLighting);
    if (!url) continue;

    if (aspectRatio && i === backdropSlot) {
      const crop = shot.backdropCropsByAspect?.[aspectRatio];
      if (crop) {
        const cropUrl = resolveReferenceDisplayUrl(crop);
        if (cropUrl) url = cropUrl;
      }
    }
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

const USER_IMAGE_MENTION_PATTERN = /@image(\d+)/gi;
const USER_GENERIC_MENTION_PATTERN = /(^|[\s([{"'])@([a-z0-9-]+)/gi;
const API_IMAGE_TAG_PATTERN = /<IMAGE_\d+>/i;

export function hasPromptImageReferences(text: string): boolean {
  return (
    API_IMAGE_TAG_PATTERN.test(text) ||
    /@image\d+/i.test(text) ||
    /@(backdropplate|charactersheet\d*|subject\d*|character\d*)/i.test(text)
  );
}

function buildAliasMap(shot: Shot | undefined): Map<string, number> {
  const map = new Map<string, number>();
  if (!shot) return map;

  const backdropSlot = getBackdropSlotIndex(shot);
  if (backdropSlot >= 0 && (shot.references[backdropSlot] || effectiveReferenceUrl(shot, backdropSlot, shot.lighting))) {
    map.set('backdropplate', backdropSlot + 1);
  }

  const subjectSlots = getSubjectChecklistSlotIndices(shot);
  subjectSlots.forEach((slot, ordinal) => {
    const imageNumber = slot + 1;
    if (!(shot.references[slot] || effectiveReferenceUrl(shot, slot, shot.lighting))) return;
    const n = ordinal + 1;
    map.set(`charactersheet${n}`, imageNumber);
    map.set(`character${n}`, imageNumber);
    map.set(`subject${n}`, imageNumber);
    if (ordinal === 0) {
      map.set('charactersheet', imageNumber);
      map.set('character', imageNumber);
      map.set('subject', imageNumber);
    }
  });

  return map;
}

/** Expand slot-based @ImageN tokens to provider-native syntax before API calls. */
export function expandPromptMentions(
  text: string,
  shot: Shot | undefined,
  providerId: string,
  opts?: { xaiImageIndexOffset?: number },
): string {
  if (!text || !shot) return text;

  const aliasMap = buildAliasMap(shot);
  const withCanonicalMentions = text.replace(
    USER_GENERIC_MENTION_PATTERN,
    (match, prefix: string, mentionToken: string) => {
      const token = mentionToken.toLowerCase();
      if (token.startsWith('image')) return match;
      const imageNumber = aliasMap.get(token);
      if (!imageNumber) return match;
      return `${prefix}@Image${imageNumber}`;
    },
  );

  return withCanonicalMentions.replace(USER_IMAGE_MENTION_PATTERN, (match, indexStr: string) => {
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