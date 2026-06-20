#!/usr/bin/env node
/**
 * Post-process raw mannequin JPGs into transparent placement PNGs.
 * Reads public/stock/mannequin-mode.json — no xAI.
 *
 * Usage:
 *   npm run stock:process-mannequin-mode
 *   npm run stock:process-mannequin-mode -- --only=female-adult-standard-front
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { pipeline, env } from '@huggingface/transformers';
import { ROOT } from './lib/env.mjs';

const MANIFEST_PATH = path.join(ROOT, 'public/stock/mannequin-mode.json');
const RAW_DIR = path.join(ROOT, 'scripts/.cache/mannequin-angles-raw');
const OUT_ROOT = path.join(ROOT, 'public');
const TRIM_ASSETS_PATH = path.join(ROOT, 'lib/constants/mannequin-assets.ts');
const TRANSFORMERS_CACHE = path.join(ROOT, 'scripts/.cache/transformers');
const TRIM_PAD = 6;
const MAX_DIM = 1024;

env.cacheDir = TRANSFORMERS_CACHE;

let remover = null;

function parseArgs(argv) {
  const force = argv.includes('--force');
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim())) : null;
  return { force, only };
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

async function getRemover() {
  if (!remover) {
    console.log('Loading RMBG-1.4 (briaai/RMBG-1.4)…');
    remover = await pipeline('background-removal', 'briaai/RMBG-1.4');
  }
  return remover;
}

async function measureTrim(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 20) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return {
    paddingBottom: Number(((height - 1 - maxY) / height).toFixed(4)),
    paddingTop: Number((minY / height).toFixed(4)),
    contentHeightRatio: Number(((maxY - minY + 1) / height).toFixed(4)),
    feetCenterX: Number((((minX + maxX) / 2) / width).toFixed(4)),
    width,
    height,
  };
}

async function matteToPng(srcJpg, destPng) {
  const segmenter = await getRemover();
  const output = await segmenter(srcJpg);
  const result = Array.isArray(output) ? output[0] : output;
  if (!result?.save) throw new Error('RMBG pipeline returned unexpected output');

  fs.mkdirSync(path.dirname(destPng), { recursive: true });
  const tmpPng = `${destPng}.rmbg.tmp.png`;
  await result.save(tmpPng);

  const trimmed = await sharp(tmpPng)
    .trim({ threshold: 12 })
    .extend({
      top: TRIM_PAD,
      bottom: TRIM_PAD,
      left: TRIM_PAD,
      right: TRIM_PAD,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  const scale = MAX_DIM / Math.max(meta.width, meta.height);
  const resized =
    scale < 1
      ? await sharp(trimmed)
          .resize(Math.round(meta.width * scale), Math.round(meta.height * scale), {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .png()
          .toBuffer()
      : trimmed;

  await sharp(resized).toFile(destPng);
  fs.unlinkSync(tmpPng);
  return resized;
}

function formatTrimBlock(results) {
  const lines = results.map(
    ({ id, trim }) =>
      `  '${id}': { paddingBottom: ${trim.paddingBottom}, paddingTop: ${trim.paddingTop}, contentHeightRatio: ${trim.contentHeightRatio}, feetCenterX: ${trim.feetCenterX} },`,
  );
  return `const MANNEQUIN_TRIM: Record<string, MannequinTrim> = {\n${lines.join('\n')}\n};`;
}

function parseExistingTrim(src) {
  const existing = {};
  const re =
    /  '([^']+)': \{ paddingBottom: ([\d.]+), paddingTop: ([\d.]+), contentHeightRatio: ([\d.]+), feetCenterX: ([\d.]+) \},/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    existing[m[1]] = {
      paddingBottom: Number(m[2]),
      paddingTop: Number(m[3]),
      contentHeightRatio: Number(m[4]),
      feetCenterX: Number(m[5]),
    };
  }
  return existing;
}

function patchTrimAssets(results) {
  const src = fs.readFileSync(TRIM_ASSETS_PATH, 'utf8');
  const merged = parseExistingTrim(src);
  for (const { id, trim } of results) {
    merged[id] = {
      paddingBottom: trim.paddingBottom,
      paddingTop: trim.paddingTop,
      contentHeightRatio: trim.contentHeightRatio,
      feetCenterX: trim.feetCenterX,
    };
  }
  const sorted = Object.entries(merged)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, trim]) => ({ id, trim }));
  const block = formatTrimBlock(sorted);
  const next = src.replace(
    /const MANNEQUIN_TRIM: Record<string, MannequinTrim> = \{[\s\S]*?\};/,
    block,
  );
  if (next === src) {
    console.warn('Warning: could not patch mannequin-assets.ts trim block');
    console.log('\nPaste manually:\n', block);
    return;
  }
  fs.writeFileSync(TRIM_ASSETS_PATH, next);
  console.log('Updated', TRIM_ASSETS_PATH);
}

async function main() {
  const { force, only } = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  let samples = (manifest.samples ?? []).filter((s) => s.generate !== false);
  if (only) {
    samples = samples.filter((s) => only.has(s.id));
  }

  fs.mkdirSync(RAW_DIR, { recursive: true });
  const results = [];

  for (const sample of samples) {
    const rawPath = path.join(RAW_DIR, `${sample.id}.jpg`);
    const destPath = path.join(OUT_ROOT, sample.file);

    if (!fs.existsSync(rawPath)) {
      if (fs.existsSync(destPath) && !force) {
        console.log(`skip ${sample.id} — PNG exists, no raw`);
        const buf = fs.readFileSync(destPath);
        results.push({ id: sample.id, trim: await measureTrim(buf) });
        continue;
      }
      throw new Error(`Missing raw source: ${rawPath}`);
    }

    if (!force && fs.existsSync(destPath)) {
      console.log(`skip ${sample.id} (exists)`);
      const buf = fs.readFileSync(destPath);
      results.push({ id: sample.id, trim: await measureTrim(buf) });
      continue;
    }

    console.log(`\n[${sample.id}] matting…`);
    const buf = await matteToPng(rawPath, destPath);
    const trim = await measureTrim(buf);
    console.log(`  ✓ ${destPath} ${trim.width}x${trim.height}`, trim);
    results.push({ id: sample.id, trim });
  }

  if (results.length) {
    patchTrimAssets(results);
    console.log(`\nDone — ${results.length} mannequin PNGs processed`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});