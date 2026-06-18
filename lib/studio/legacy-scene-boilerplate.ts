/**
 * Exact phrases copied from old preview-image / demo scene templates.
 * Only these known legacy strings are removed — never generic terms like
 * "dress shirt", "studio", or "rule of thirds" that a user might intend.
 */
/** Full MS mannequin preview-image prompt previously used as demo Scene Setup. */
export const LEGACY_MS_PREVIEW_SCENE =
  'Use the exact same matte gray male mannequin identity from the reference. ' +
  'Pure photographic film-school reference still. Zero typography: no text, letters, words, numbers, ' +
  'captions, labels, watermarks, logos, signage, UI overlays. ' +
  'Smooth sculpted gray dress shirt, belt at waist — hard-surface gray sculpt. ' +
  'Neutral gray studio, cinematic 35mm lens. Medium shot waist up ONLY: bottom edge cuts exactly at belt line — ' +
  'NO trousers visible below belt, NO thighs. Frame ends at waist. ' +
  'Rule of thirds, subject on the right third. Soft cinematic key light, shallow depth of field.';

export const LEGACY_SCENE_BOILERPLATE: readonly string[] = [
  LEGACY_MS_PREVIEW_SCENE,
  'Use the exact same matte gray male mannequin identity from the reference.',
  'Pure photographic film-school reference still.',
  'Zero typography: no text, letters, words, numbers, captions, labels, watermarks, logos, signage, UI overlays.',
  'Matte gray male mannequin in a smooth sculpted gray dress shirt with belt at the waist. Hard-surface gray sculpt.',
  'Smooth sculpted gray dress shirt, belt at waist — hard-surface gray sculpt.',
  'Neutral gray studio environment.',
  'Neutral gray studio, cinematic 35mm lens.',
  'Medium shot waist up ONLY: bottom edge cuts exactly at belt line — NO trousers visible below belt, NO thighs. Frame ends at waist.',
  'Rule of thirds, subject on the right third.',
  'Soft cinematic key light, shallow depth of field.',
  'Close-up of the matte gray mannequin subject. Neutral studio, soft key light, shallow depth of field.',
  'Long shot of the mannequin subject in a neutral gray studio. Wide framing, cinematic atmosphere.',
];

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .replace(/\.+/g, '.')
    .replace(/^\s*[.,]\s*/g, '')
    .replace(/\s*[.,]\s*$/g, '')
    .trim();
}

/** Remove only known legacy demo/preview boilerplate — preserves user-authored scene text. */
export function stripLegacySceneBoilerplate(text: string): string {
  let result = text;
  for (const phrase of LEGACY_SCENE_BOILERPLATE) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'gi'), ' ');
  }
  return normalizeWhitespace(result);
}

export function isLegacyPreviewSceneText(text: string): boolean {
  return !stripLegacySceneBoilerplate(text);
}

/** Drop scene-setup sentences duplicated verbatim in shot activity. */
export function removeDuplicateActivity(scene: string, activity: string): string {
  if (!activity.trim()) return scene;
  const activityNorm = activity.trim().replace(/\.$/, '');
  const escaped = activityNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return normalizeWhitespace(scene.replace(new RegExp(`\\b${escaped}\\b\\.?\\s*`, 'gi'), ' '));
}

export function prepareSceneTextForGeneration(
  sceneSetup: string,
  shotActivity: string,
): { sceneSetup: string; shotActivity: string } {
  const setup = stripLegacySceneBoilerplate(sceneSetup.trim());
  const activity = stripLegacySceneBoilerplate(shotActivity.trim());
  return {
    sceneSetup: removeDuplicateActivity(setup, activity),
    shotActivity: activity,
  };
}