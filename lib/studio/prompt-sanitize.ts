import { FIELD_SIZE_PROMPTS } from '@/lib/studio/generation-prompt-constants';
import type {
  CameraSettings,
  FrameComposition,
  LightingSettings,
  ReferenceRole,
} from '@/lib/types/studio';

type RefLike = { role: ReferenceRole | string };

function applyPatterns(text: string, patterns: RegExp[]): string {
  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, ' ');
  }
  return result;
}

function hasSubjectRef(refs: RefLike[]): boolean {
  return refs.some((r) => r.role === 'Subject');
}

function hasBackdropRef(refs: RefLike[]): boolean {
  return refs.some((r) => r.role === 'Backdrop');
}

function usesStructuredComposition(frame: FrameComposition): boolean {
  return frame.guide !== 'none';
}

/** Remove scene-setup phrases already covered by reference images. */
function stripReferenceRedundancy(text: string, refs: RefLike[]): string {
  const patterns: RegExp[] = [];

  if (hasSubjectRef(refs)) {
    patterns.push(
      /use the exact same[\s\S]*?from the reference\.?\s*/gi,
      /match(?:ing)?(?: the)? subject identity[\s\S]*?\.?\s*/gi,
      /preserve(?: the)? subject identity[\s\S]*?\.?\s*/gi,
      /same[\s\S]*?identity from the reference\.?\s*/gi,
      /from the (?:subject )?reference\.?\s*/gi,
    );
  }

  if (hasBackdropRef(refs)) {
    patterns.push(
      /neutral gray studio(?: environment)?\.?\s*/gi,
      /neutral studio(?: environment)?\.?\s*/gi,
      /(?:gray |neutral )?studio (?:environment|backdrop|background)\.?\s*/gi,
      /match(?:ing)?(?: the)? environment[\s\S]*?\.?\s*/gi,
      /match(?:ing)?(?: the)? (?:background|backdrop)[\s\S]*?\.?\s*/gi,
    );
  }

  return applyPatterns(text, patterns);
}

/** Remove framing, lens, and composition phrases covered by camera / composition panels. */
function stripCameraRedundancy(text: string, camera: CameraSettings, frame: FrameComposition): string {
  const patterns: RegExp[] = [
    /pure photographic film-school reference still\.?\s*/gi,
    /zero typography:[\s\S]*?ui overlays\.?\s*/gi,
    /no text[\s\S]*?ui overlays\.?\s*/gi,
    /cinematic\s+\d+\s*mm\s+lens\.?\s*/gi,
    /\d+\s*mm(?:\s+(?:standard|wide|telephoto))?\s+lens\.?\s*/gi,
    /\bcinematic\s+(?!lighting\b)/gi,
    /shallow depth of field\.?\s*/gi,
    /(?:medium|wide|full|long|close(?:-|\s)up|cowboy|choker|extreme)[\s\S]*?shot[\s\S]*?(?:only)?:?[\s\S]*?(?:belt line|waist|frame ends)[^.]*\.?\s*/gi,
    /frame ends at[\s\S]*?\.?\s*/gi,
    /bottom edge cuts[\s\S]*?\.?\s*/gi,
    /no trousers[\s\S]*?\.?\s*/gi,
  ];

  const fieldPhrase = FIELD_SIZE_PROMPTS[camera.fieldSize];
  if (fieldPhrase) {
    const escaped = fieldPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    patterns.push(new RegExp(`\\b${escaped}\\b[^.]*\\.?\\s*`, 'gi'));
  }

  if (usesStructuredComposition(frame)) {
    patterns.push(
      /rule of thirds,?\s*subject on the[\s\S]*?(?:third|line|portion|corner)[^.]*\.?\s*/gi,
      /rule of thirds\.?\s*/gi,
      /subject on the (?:left|right|upper|lower|center|middle)[\s\S]*?(?:third|line|portion|corner)[^.]*\.?\s*/gi,
      /,?\s*(?:cinematic\s+)?(?:left|right|upper|lower|center|middle)\s+third\.?\s*/gi,
    );
  }

  return applyPatterns(text, patterns);
}

/** Remove lighting phrases covered by the lighting panel. */
function stripLightingRedundancy(text: string): string {
  return applyPatterns(text, [
    /soft cinematic key light\.?\s*/gi,
    /(?:cinematic |dramatic |natural )?lighting with[\s\S]*?\.?\s*/gi,
    /soft key light\.?\s*/gi,
    /\d{3,5}K color temperature\.?\s*/gi,
  ]);
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/,+/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*\./g, '.')
    .replace(/\.\s*,/g, '.')
    .replace(/\s+([,.])/g, '$1')
    .replace(/\.+/g, '.')
    .replace(/^\s*[.,]\s*/g, '')
    .replace(/\s*[.,]\s*$/g, '')
    .trim();
}

function removeDuplicateActivity(scene: string, activity: string): string {
  if (!activity.trim()) return scene;
  const activityNorm = activity.trim().replace(/\.$/, '');
  const escaped = activityNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return scene.replace(new RegExp(`\\b${escaped}\\b\\.?\\s*`, 'gi'), ' ');
}

/**
 * Trim scene setup / activity text that duplicates reference images or structured shot settings.
 * Keeps creative scene content (wardrobe, props, mood) that panels do not express.
 */
export function sanitizeSceneTextForGeneration(
  sceneSetup: string,
  shotActivity: string,
  ctx: {
    refs: RefLike[];
    camera: CameraSettings;
    lighting: LightingSettings;
    frame: FrameComposition;
  },
): { sceneSetup: string; shotActivity: string } {
  let setup = sceneSetup.trim();
  let activity = shotActivity.trim();

  if (ctx.refs.length > 0) {
    setup = stripReferenceRedundancy(setup, ctx.refs);
    activity = stripReferenceRedundancy(activity, ctx.refs);
  }

  setup = stripLightingRedundancy(setup);
  activity = stripLightingRedundancy(activity);

  setup = stripCameraRedundancy(setup, ctx.camera, ctx.frame);
  activity = stripCameraRedundancy(activity, ctx.camera, ctx.frame);

  setup = removeDuplicateActivity(setup, activity);

  return {
    sceneSetup: normalizeWhitespace(setup),
    shotActivity: normalizeWhitespace(activity),
  };
}