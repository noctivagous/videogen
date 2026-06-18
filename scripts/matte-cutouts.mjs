#!/usr/bin/env node
/**
 * Remove backgrounds from raw mannequin JPGs using RMBG-1.4 (transformers.js).
 * Input:  scripts/.cache/cutouts-raw/ (raw JPGs from stock:generate)
 * Output: public/stock/subjects/ (transparent PNGs, 1280×720)
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { pipeline, env } from '@huggingface/transformers';
import { ROOT } from './lib/env.mjs';
import {
  MANIFEST_PATH,
  RAW_CACHE_DIR,
  TARGET_H,
  TARGET_W,
  ensureDir,
  rawJpgPath,
  stockPath,
} from './lib/stock-paths.mjs';

const TRANSFORMERS_CACHE = path.join(ROOT, 'scripts/.cache/transformers');
env.cacheDir = TRANSFORMERS_CACHE;

let remover = null;

async function getRemover() {
  if (!remover) {
    console.log('Loading RMBG-1.4 (briaai/RMBG-1.4)…');
    remover = await pipeline('background-removal', 'briaai/RMBG-1.4');
  }
  return remover;
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function flattenFiles(manifest) {
  const files = [];
  for (const group of ['male', 'female', 'ots']) {
    for (const item of manifest[group] ?? []) {
      files.push(item.file);
    }
  }
  // Identity cutouts used by the app checker
  files.push('subjects/male/mannequin-identity.png');
  files.push('subjects/female/mannequin-identity.png');
  return [...new Set(files)];
}

function parseArgs(argv) {
  const force = argv.includes('--force');
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim())) : null;
  return { force, only };
}

async function matteToPng(srcJpg, destPng) {
  const segmenter = await getRemover();
  const output = await segmenter(srcJpg);
  const result = Array.isArray(output) ? output[0] : output;
  if (!result?.save) {
    throw new Error('RMBG pipeline returned unexpected output');
  }
  const tmpPng = `${destPng}.tmp.png`;
  ensureDir(path.dirname(destPng));
  await result.save(tmpPng);

  await sharp(tmpPng)
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .png()
    .toFile(destPng);

  fs.unlinkSync(tmpPng);
}

async function resolveSource(relPng) {
  const raw = rawJpgPath(relPng);
  if (fs.existsSync(raw)) return raw;

  // mannequin-identity falls back to cu cutout
  if (relPng.endsWith('mannequin-identity.png')) {
    const cu = relPng.replace('mannequin-identity.png', 'cu.jpg');
    if (fs.existsSync(cu)) return cu;
    const cuRaw = rawJpgPath(relPng.replace('mannequin-identity.png', 'cu.png'));
    if (fs.existsSync(cuRaw)) return cuRaw;
  }

  return null;
}

async function main() {
  const { force, only } = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  let files = flattenFiles(manifest);

  if (only) {
    files = files.filter((f) => {
      const parts = f.split('/');
      const key = parts.slice(1).join('/').replace('.png', '');
      return only.has(key) || only.has(parts[2]?.replace('.png', ''));
    });
  }

  ensureDir(RAW_CACHE_DIR);
  let done = 0;
  let skipped = 0;

  console.log(`Matting ${files.length} cutouts with RMBG-1.4…`);

  for (const rel of files) {
    const dest = stockPath(rel);
    const src = await resolveSource(rel);

    if (!src) {
      console.warn(`  skip ${rel} — no raw JPG at ${rawJpgPath(rel)}`);
      skipped++;
      continue;
    }

    if (!force && fs.existsSync(dest)) {
      skipped++;
      continue;
    }

    process.stdout.write(`  ${rel} … `);
    await matteToPng(src, dest);
    console.log('ok');
    done++;
  }

  console.log(`\nMatte complete: ${done} written, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});