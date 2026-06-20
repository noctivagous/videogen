#!/usr/bin/env node
/**
 * Expand mannequin-mode.json with teen/child samples from adult templates.
 * Usage: node scripts/expand-mannequin-age-samples.mjs
 */
import fs from 'fs';
import path from 'path';
import { ROOT } from './lib/env.mjs';

const MANIFEST_PATH = path.join(ROOT, 'public/stock/mannequin-mode.json');

const AGE_SUBJECT = {
  teen: {
    male: 'Adolescent matte gray male display mannequin with teenage proportions (ages 14–16), lean adolescent build. Sculpted facial features, side-parted combed hair.',
    female:
      'Adolescent matte gray female display mannequin with teenage proportions (ages 14–16). Sculpted facial features, clean bob hairstyle.',
  },
  child: {
    male: 'Child matte gray male display mannequin with young child proportions (ages 8–10), shorter stature, slightly larger head-to-body ratio. Sculpted facial features, side-parted hair.',
    female:
      'Child matte gray female display mannequin with young child proportions (ages 8–10), shorter stature, slightly larger head-to-body ratio. Sculpted facial features, bob hairstyle.',
  },
};

const AGE_WARDROBE = {
  teen: {
    male: 'Gray dress shirt with collar and buttons, chino pants, belt with buckle, dress shoes — unified matte gray hard-surface sculpt.',
    female: 'Sculpted blouse with collar, sculpted skirt, sculpted flats — unified matte gray hard-surface sculpt.',
  },
  child: {
    male: 'Gray dress shirt with collar, chino pants, belt, dress shoes — unified matte gray hard-surface sculpt, child-sized.',
    female: 'Sculpted blouse with collar, sculpted skirt, sculpted flats — unified matte gray hard-surface sculpt, child-sized.',
  },
};

const ANGLE_VIEWS = {
  front:
    'Facing camera directly, arms relaxed at sides. Full shot head to toe filling 90% of tall frame.',
  threeQuarterLeft:
    'Three-quarter left view: body turned 45° toward camera-left, both eyes partially visible. Arms at sides. Full shot head to toe.',
  threeQuarterRight:
    'Three-quarter right view: body turned 45° toward camera-right, both eyes partially visible. Arms at sides. Full shot head to toe.',
  left: 'Pure left profile: turned 90°, camera sees left side only. Arms at sides. Full shot head to toe.',
  right: 'Pure right profile: turned 90°, camera sees right side only. Arms at sides. Full shot head to toe.',
  rearThreeQuarterLeft:
    'Rear three-quarter left view: body turned ~135° so camera sees back-left of head and torso — mostly back of head and left ear, slight left cheek, back of shirt and left shoulder. Arms at sides. Full shot head to toe.',
  back: 'Back view: facing away, back of head, back of clothing visible. No face. Arms at sides. Full shot head to toe.',
  rearThreeQuarterRight:
    'Rear three-quarter right view: body turned ~225° so camera sees back-right of head and torso — mostly back of head and right ear, slight right cheek, back of shirt and right shoulder. Arms at sides. Full shot head to toe.',
};

function buildPrompt(gender, age, angle) {
  const subject = AGE_SUBJECT[age][gender];
  const wardrobe = AGE_WARDROBE[age][gender];
  const view = ANGLE_VIEWS[angle];
  return `Full-body ${subject} ${wardrobe} On neutral gray seamless studio backdrop. ${view} Soft even studio lighting, cinematic 35mm look. No text or logos. Vertical 9:16 portrait.`;
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

manifest.variants.ages = manifest.variants.ages.map((a) =>
  a.id === 'teen' || a.id === 'child' ? { ...a, generateArt: true } : a,
);

const adultSamples = manifest.samples.filter((s) => s.age === 'adult' && s.generate !== false);
const existingIds = new Set(manifest.samples.map((s) => s.id));
const newSamples = [];

for (const age of ['teen', 'child']) {
  for (const adult of adultSamples) {
    const id = adult.id.replace('-adult-', `-${age}-`);
    if (existingIds.has(id)) continue;
    newSamples.push({
      id,
      gender: adult.gender,
      age,
      pose: adult.pose,
      angle: adult.angle,
      file: adult.file.replace('/adult/', `/${age}/`),
      generate: true,
      prompt: buildPrompt(adult.gender, age, adult.angle),
    });
  }
}

manifest.samples.push(...newSamples);
fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Added ${newSamples.length} teen/child samples (${manifest.samples.length} total)`);