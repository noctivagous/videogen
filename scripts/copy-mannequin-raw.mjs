#!/usr/bin/env node
/** Copy a generated JPG into the mannequin raw cache by sample id. */
import fs from 'fs';
import path from 'path';
import { ROOT } from './lib/env.mjs';

const [src, id] = process.argv.slice(2);
if (!src || !id) {
  console.error('Usage: node scripts/copy-mannequin-raw.mjs <src-jpg> <sample-id>');
  process.exit(1);
}
const dest = path.join(ROOT, 'scripts/.cache/mannequin-angles-raw', `${id}.jpg`);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`copied → ${dest}`);