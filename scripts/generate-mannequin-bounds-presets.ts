/**
 * Regenerate lib/constants/mannequin-bounds-presets.ts from subject cutout alpha bounds.
 * Each field-size PNG embeds the intended framing; we measure the silhouette bbox.
 *
 * Usage: npx tsx scripts/generate-mannequin-bounds-presets.ts
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ALL_FIELD_SIZES, resolveFieldSizeAsset } from '../lib/constants/subject-cutouts';
import type { FieldSize, MannequinAge, MannequinGender } from '../lib/types/studio';
import type { SubjectCutoutBounds } from '../lib/studio/subject-cutout-bounds';

/** Hand-tuned overrides — cutout bbox is a bootstrap; close-ups are tuned by eye. */
const TUNED_FIELD_PRESETS: Partial<
  Record<FieldSize, Partial<SubjectCutoutBounds>>
> = {
  ecu: { insetLeft: -0.3, insetTop: 0, widthToFrameHeight: 3 },
  cu: { insetLeft: 0.2, widthToFrameHeight: 1.7 },
  mcu: { widthToFrameHeight: 0.987 },
};

const DEMOGRAPHICS: `${MannequinGender}-${MannequinAge}`[] = [
  'male-adult',
  'male-teen',
  'male-child',
  'female-adult',
  'female-teen',
  'female-child',
];

async function measureCutoutBounds(file: string): Promise<SubjectCutoutBounds> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + (channels - 1)];
      if (alpha > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const aspect = width / height;
  return {
    insetLeft: +(minX / width).toFixed(6),
    insetTop: +(minY / height).toFixed(6),
    widthToFrameHeight: +(((maxX - minX + 1) / width) * aspect).toFixed(6),
  };
}

async function boundsForGenderField(
  gender: MannequinGender,
  fieldSize: FieldSize,
): Promise<SubjectCutoutBounds> {
  const asset = resolveFieldSizeAsset(fieldSize);
  const file = path.join(process.cwd(), 'public/stock/subjects', gender, `${asset}.png`);
  const measured = await measureCutoutBounds(file);
  const tuned = TUNED_FIELD_PRESETS[fieldSize];
  if (!tuned) return measured;
  return { ...measured, ...tuned };
}

async function main(): Promise<void> {
  const lines: string[] = [
    '// Generated from subject cutout alpha bounds at 16:9 center placement, front facing, eye-level.',
    '// Regenerate: npm run generate:mannequin-bounds-presets',
    '//',
    '// Table shape today: fieldSize → gender-age → bounds',
    '// Near-term: fieldSize → gender-age → mannequinFacing → bounds',
    '// Long-term: fieldSize → gender-age → mannequinFacing → cameraAngle → bounds',
    '// Contract: lib/studio/mannequin-bounds-contract.ts',
    '',
    "import type { MannequinBoundsFrame } from '@/lib/studio/mannequin-bounds-framing';",
    'import {',
    '  MANNEQUIN_BOUNDS_DEFAULT_CAMERA_ANGLE,',
    '  MANNEQUIN_BOUNDS_DEFAULT_FACING,',
    '  type MannequinBoundsPreset,',
    '  type MannequinDemographicKey,',
    '  mannequinDemographicKey,',
    "} from '@/lib/studio/mannequin-bounds-contract';",
    "import type { CameraAngle, FieldSize, MannequinAge, MannequinAngle, MannequinGender } from '@/lib/types/studio';",
    '',
    'export type { MannequinBoundsPreset, MannequinDemographicKey };',
    'export { mannequinDemographicKey };',
    '',
    'export const MANNEQUIN_DEMOGRAPHICS: MannequinDemographicKey[] = [',
    ...DEMOGRAPHICS.map((d) => `  '${d}',`),
    '];',
    '',
    'export const FIELD_SIZE_BOUNDS_PRESETS: Record<FieldSize, Record<MannequinDemographicKey, MannequinBoundsPreset>> = {',
  ];

  for (const fieldSize of ALL_FIELD_SIZES) {
    lines.push(`  '${fieldSize}': {`);
    const maleBounds = await boundsForGenderField('male', fieldSize);
    const femaleBounds = await boundsForGenderField('female', fieldSize);
    for (const demographic of DEMOGRAPHICS) {
      const gender = demographic.split('-')[0] as MannequinGender;
      const preset = gender === 'female' ? femaleBounds : maleBounds;
      lines.push(
        `    '${demographic}': { insetLeft: ${preset.insetLeft}, insetTop: ${preset.insetTop}, widthToFrameHeight: ${preset.widthToFrameHeight} },`,
      );
    }
    lines.push('  },');
  }

  lines.push(
    '};',
    '',
    'export function boundsPresetForDemographic(',
    '  fieldSize: FieldSize,',
    '  gender: MannequinGender,',
    '  age: MannequinAge,',
    '): MannequinBoundsPreset {',
    '  return FIELD_SIZE_BOUNDS_PRESETS[fieldSize][mannequinDemographicKey(gender, age)];',
    '}',
    '',
    '/**',
    ' * Resolve preset for a full variant. Non-front facing falls back to front row until',
    ' * per-facing tables are tuned. cameraAngle is a placeholder (eye-level only today).',
    ' */',
    'export function boundsPresetForVariant(',
    '  fieldSize: FieldSize,',
    '  gender: MannequinGender,',
    '  age: MannequinAge,',
    '  facing: MannequinAngle = MANNEQUIN_BOUNDS_DEFAULT_FACING,',
    '  cameraAngle: CameraAngle = MANNEQUIN_BOUNDS_DEFAULT_CAMERA_ANGLE,',
    '): MannequinBoundsPreset {',
    '  void facing;',
    '  void cameraAngle;',
    '  return boundsPresetForDemographic(fieldSize, gender, age);',
    '}',
    '',
  );

  const outPath = path.join(process.cwd(), 'lib/constants/mannequin-bounds-presets.ts');
  writeFileSync(outPath, lines.join('\n'));
  console.log(`Wrote ${ALL_FIELD_SIZES.length} field sizes from cutout bounds to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});