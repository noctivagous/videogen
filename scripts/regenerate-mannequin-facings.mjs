#!/usr/bin/env node
/**
 * Regenerate teen/child + female-adult-right mannequin raws using the correct
 * adult-male angle as reference (xAI edit) so facing matches exactly.
 *
 * Usage:
 *   node scripts/regenerate-mannequin-facings.mjs
 *   node scripts/regenerate-mannequin-facings.mjs --only=female-adult-standard-right
 */
import fs from 'fs';
import path from 'path';
import { ROOT, requireXaiApiKey } from './lib/env.mjs';
import { saveJpeg, xaiEdit, xaiGenerate } from './lib/xai-image.mjs';

const MANIFEST_PATH = path.join(ROOT, 'public/stock/mannequin-mode.json');
const RAW_DIR = path.join(ROOT, 'scripts/.cache/mannequin-angles-raw');
const DELAY_MS = Number(process.env.XAI_REQUEST_DELAY_MS || 2500);

const ANGLE_FILES = {
  front: 'front.png',
  threeQuarterLeft: 'three-quarter-left.png',
  threeQuarterRight: 'three-quarter-right.png',
  left: 'left-profile.png',
  rearThreeQuarterLeft: 'rear-three-quarter-left.png',
  back: 'back.png',
  rearThreeQuarterRight: 'rear-three-quarter-right.png',
  right: 'right-profile.png',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(argv) {
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim())) : null;
  return { only };
}

function adultMaleRef(angle) {
  const file = ANGLE_FILES[angle];
  if (!file) return null;
  return path.join(ROOT, 'public/mannequins/male/adult/standard', file);
}

function samplesToFix(manifest, only) {
  let samples = manifest.samples.filter(
    (s) =>
      s.generate !== false &&
      (s.id === 'female-adult-standard-right' || s.age === 'teen' || s.age === 'child'),
  );
  if (only) samples = samples.filter((s) => only.has(s.id));
  return samples;
}

async function main() {
  const { only } = parseArgs(process.argv.slice(2));
  const apiKey = requireXaiApiKey();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const samples = samplesToFix(manifest, only);

  if (!samples.length) {
    console.log('No samples to regenerate.');
    return;
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  console.log(`Regenerating ${samples.length} mannequin facings (reference: adult male)…`);

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const dest = path.join(RAW_DIR, `${sample.id}.jpg`);
    const ref = adultMaleRef(sample.angle);

    process.stdout.write(`[${i + 1}/${samples.length}] ${sample.id}… `);

    let buf;
    if (ref && fs.existsSync(ref)) {
      buf = await xaiEdit(apiKey, sample.prompt, ref, { aspectRatio: '9:16' });
    } else {
      buf = await xaiGenerate(apiKey, sample.prompt, { aspectRatio: '9:16' });
    }

    saveJpeg(buf, dest);
    console.log('✓');

    if (i < samples.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone — ${samples.length} raws in ${RAW_DIR}`);
  console.log('Next: npm run stock:process-mannequin-mode -- --force --only=<ids>');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});