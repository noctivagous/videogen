#!/usr/bin/env node
/**
 * Lists missing subject cutout PNGs expected by lib/constants/subject-cutouts.ts.
 * PNGs are generated via npm run stock:pipeline (xAI + RMBG-1.4 matte).
 * Usage: npm run stock:cutouts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STOCK = path.join(__dirname, '..', 'public/stock/subjects');

const FIELD_SIZES = [
  'ecu', 'ch', 'bcu', 'cu', 'mcu', 'close-shot', 'ms', 'cowboy', 'mws',
  'fs', 'els', 'vls', 'gv',
];

const OTS = ['male-over-male', 'male-over-female', 'female-over-male'];

const expected = [];
for (const gender of ['male', 'female']) {
  for (const fs_ of FIELD_SIZES) {
    expected.push(`subjects/${gender}/${fs_}.png`);
  }
  expected.push(`subjects/${gender}/mannequin-identity.png`);
}
for (const v of OTS) {
  expected.push(`subjects/ots/${v}.png`);
}

const missing = expected.filter((rel) => !fs.existsSync(path.join(__dirname, '..', 'public/stock', rel)));
const present = expected.length - missing.length;

console.log(`Subject cutouts: ${present}/${expected.length} PNGs present.`);

if (missing.length) {
  console.log('\nMissing:');
  for (const m of missing) console.log(`  - public/stock/${m}`);
  console.log('\nGenerate with prompts from scripts/subject-cutout-prompts.json, then:');
  console.log('  bash scripts/import-cutout.sh <source.jpg> subjects/male/ms.png');
  process.exit(1);
}

console.log('All subject cutout PNGs are present.');