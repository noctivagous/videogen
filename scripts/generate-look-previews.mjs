#!/usr/bin/env node
/**
 * Generate Look Library preview JPGs from scripts/look-preview-manifest.json via xAI.
 * Usage:
 *   npm run stock:looks
 *   npm run stock:looks -- --only=daylight-warm-dusk,surreality-false-color
 *   npm run stock:looks -- --categories-only
 *   npm run stock:looks -- --recipes-only
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { requireXaiApiKey } from './lib/env.mjs';
import { ensureDir, resolveReference, stockPath } from './lib/stock-paths.mjs';
import { xaiEdit } from './lib/xai-image.mjs';

const MANIFEST_PATH = path.join(process.cwd(), 'scripts/look-preview-manifest.json');
const DELAY_MS = Number(process.env.XAI_REQUEST_DELAY_MS || 2500);
const TARGET_W = 640;
const TARGET_H = 360;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function parseArgs(argv) {
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run');
  const categoriesOnly = argv.includes('--categories-only');
  const recipesOnly = argv.includes('--recipes-only');
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  return {
    force,
    dryRun,
    categoriesOnly,
    recipesOnly,
    only: onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim())) : null,
  };
}

function matchesOnly(entry, only) {
  if (!only) return true;
  const stem = path.basename(entry.file, path.extname(entry.file));
  return only.has(entry.id) || only.has(stem);
}

async function writePreview(buf, destPath) {
  ensureDir(path.dirname(destPath));
  await sharp(buf)
    .resize(TARGET_W, TARGET_H, { fit: 'cover' })
    .jpeg({ quality: 88 })
    .toFile(destPath);
}

async function withRetries(label, fn, attempts = 4) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = /xAI (429|500|502|503|520)/.test(String(err?.message ?? err));
      if (!retryable || i === attempts) throw err;
      const wait = DELAY_MS * i * 2;
      console.log(`  ${label} failed (${err.message}) — retry ${i}/${attempts - 1} in ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function generateOne(apiKey, manifest, entry) {
  const dest = stockPath(entry.file);
  const refPath = resolveReference(manifest.referenceFile);
  const prompt = `${manifest.basePrompt} ${entry.clause}`;
  const buf = await withRetries(entry.abbr || entry.id, async () => {
    console.log(`  edit ← ${path.basename(refPath)}`);
    return xaiEdit(apiKey, prompt, refPath);
  });
  await writePreview(buf, dest);
  console.log(`  ✓ ${dest}`);
}

async function main() {
  const { force, dryRun, categoriesOnly, recipesOnly, only } = parseArgs(process.argv.slice(2));
  const apiKey = requireXaiApiKey();
  const manifest = loadManifest();

  let entries = [
    ...manifest.categories.map((c) => ({ ...c, kind: 'category' })),
    ...manifest.recipes.map((r) => ({ ...r, kind: 'recipe' })),
  ];

  if (categoriesOnly) entries = entries.filter((e) => e.kind === 'category');
  if (recipesOnly) entries = entries.filter((e) => e.kind === 'recipe');
  if (only) entries = entries.filter((e) => matchesOnly(e, only));

  if (!entries.length) throw new Error('No look preview entries matched filters');

  console.log(
    `Look previews: ${entries.length} images (dry-run=${dryRun}, force=${force})`,
  );

  for (const entry of entries) {
    const dest = stockPath(entry.file);
    const label = entry.abbr || entry.id;
    console.log(`\n[${label}] ${entry.file}`);

    if (!force && fs.existsSync(dest)) {
      console.log('  skip (exists)');
      continue;
    }

    if (dryRun) {
      console.log(`  would write ${dest}`);
      continue;
    }

    await generateOne(apiKey, manifest, entry);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});