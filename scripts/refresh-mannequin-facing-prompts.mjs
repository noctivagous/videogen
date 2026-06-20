#!/usr/bin/env node
/**
 * Rewrite teen/child (+ fixable adult) prompts with explicit camera-facing directions
 * matching the correct adult-male convention.
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
  adult: {
    male: 'Matte gray male display mannequin with sculpted facial features, side-parted combed hair.',
    female: 'Matte gray female display mannequin with sculpted facial features, clean bob hairstyle.',
  },
};

const AGE_WARDROBE = {
  teen: {
    male: 'Gray dress shirt with collar and buttons, chino pants, belt with buckle, dress shoes — unified matte gray hard-surface sculpt.',
    female: 'Sculpted blouse with collar, sculpted skirt, sculpted flats — unified matte gray hard-surface sculpt.',
  },
  child: {
    male: 'Gray dress shirt, chino pants, belt, dress shoes — child-sized matte gray hard-surface sculpt.',
    female: 'Sculpted blouse with collar, sculpted skirt, sculpted flats — child-sized matte gray hard-surface sculpt.',
  },
  adult: {
    male: 'Gray dress shirt with collar and buttons, chino pants, belt with buckle, dress shoes — unified matte gray hard-surface sculpt.',
    female: 'Sculpted blouse with collar, sculpted skirt, sculpted flats — unified matte gray hard-surface sculpt.',
  },
};

const ANGLE_VIEWS = {
  front:
    'FRONT view only: mannequin faces camera directly, shoulders square, both eyes visible, nose centered. Arms relaxed at sides. Full shot head to toe filling 90% of tall frame.',
  threeQuarterLeft:
    'THREE-QUARTER LEFT view only: body and head turned 45° toward the LEFT side of the frame. Both eyes partially visible, nose points upper-left. More of the right shoulder recedes. Arms at sides. Full shot head to toe.',
  threeQuarterRight:
    'THREE-QUARTER RIGHT view only: body and head turned 45° toward the RIGHT side of the frame. Both eyes partially visible, nose points upper-right. More of the left shoulder recedes. Arms at sides. Full shot head to toe.',
  left:
    'LEFT PROFILE view only: strict 90° side view, mannequin faces toward the LEFT edge of the frame — nose, chin, and toes all point left. Camera sees the mannequin\'s right side (left ear hidden behind head). Arms at sides. Full shot head to toe.',
  right:
    'RIGHT PROFILE view only: strict 90° side view, mannequin faces toward the RIGHT edge of the frame — nose, chin, and toes all point right. Camera sees the mannequin\'s left side (right ear hidden behind head). Arms at sides. Full shot head to toe.',
  rearThreeQuarterLeft:
    'REAR THREE-QUARTER LEFT view only: body turned ~135° so camera sees back-left — mostly back of head and left ear, slight left cheek, back of shirt and left shoulder prominent. Arms at sides. Full shot head to toe.',
  back:
    'BACK view only: mannequin faces directly away from camera. Back of head, back of shirt and clothing visible. No face. Arms at sides. Full shot head to toe.',
  rearThreeQuarterRight:
    'REAR THREE-QUARTER RIGHT view only: body turned ~225° so camera sees back-right — mostly back of head and right ear, slight right cheek, back of shirt and right shoulder prominent. Arms at sides. Full shot head to toe.',
};

function buildPrompt(gender, age, angle) {
  const subject = AGE_SUBJECT[age][gender];
  const wardrobe = AGE_WARDROBE[age][gender];
  const view = ANGLE_VIEWS[angle];
  return `Full-body ${subject} ${wardrobe} On neutral gray seamless studio backdrop. ${view} Soft even studio lighting, cinematic 35mm look. No text or logos. Vertical 9:16 portrait.`;
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
let updated = 0;

for (const sample of manifest.samples) {
  const shouldUpdate =
    sample.id === 'female-adult-standard-right' ||
    sample.age === 'teen' ||
    sample.age === 'child';
  if (!shouldUpdate) continue;
  sample.prompt = buildPrompt(sample.gender, sample.age, sample.angle);
  updated++;
}

fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated ${updated} facing prompts in mannequin-mode.json`);