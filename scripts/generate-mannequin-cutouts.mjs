#!/usr/bin/env node
/**
 * Generate raw mannequin JPGs via xAI (generate + reference edits).
 * Output: scripts/.cache/cutouts-raw/ (one JPG per manifest entry)
 * Next step: npm run stock:matte
 */
import fs from 'fs';
import path from 'path';
import { requireXaiApiKey } from './lib/env.mjs';
import {
  MANIFEST_PATH,
  RAW_CACHE_DIR,
  ensureDir,
  rawJpgPath,
  resolveReference,
} from './lib/stock-paths.mjs';
import { saveJpeg, xaiEdit, xaiGenerate } from './lib/xai-image.mjs';

const DELAY_MS = Number(process.env.XAI_REQUEST_DELAY_MS || 2500);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function flattenEntries(manifest) {
  const entries = [];
  for (const item of manifest.male ?? []) {
    entries.push({ ...item, group: 'male', key: `male/${item.fieldSize}` });
  }
  for (const item of manifest.female ?? []) {
    entries.push({ ...item, group: 'female', key: `female/${item.fieldSize}` });
  }
  for (const item of manifest.ots ?? []) {
    entries.push({ ...item, group: 'ots', key: `ots/${item.variant}` });
  }
  return entries;
}

function topoSort(entries) {
  const byFile = new Map(entries.map((e) => [e.file, e]));
  const inDegree = new Map(entries.map((e) => [e.file, 0]));
  const dependents = new Map(entries.map((e) => [e.file, []]));

  for (const e of entries) {
    if (!e.reference || !byFile.has(e.reference)) continue;
    inDegree.set(e.file, (inDegree.get(e.file) || 0) + 1);
    dependents.get(e.reference).push(e.file);
  }

  const queue = entries.filter((e) => (inDegree.get(e.file) || 0) === 0).map((e) => e.file);
  const order = [];

  while (queue.length) {
    const file = queue.shift();
    const entry = byFile.get(file);
    if (entry) order.push(entry);
    for (const next of dependents.get(file) || []) {
      inDegree.set(next, inDegree.get(next) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  if (order.length !== entries.length) {
    const missing = entries.filter((e) => !order.find((o) => o.file === e.file)).map((e) => e.file);
    throw new Error(`Manifest dependency cycle or unresolved refs: ${missing.join(', ')}`);
  }

  return order;
}

function buildPrompt(manifest, entry) {
  return `${entry.prompt} ${manifest.cutoutSuffix}`.trim();
}

function parseArgs(argv) {
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run');
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim())) : null;
  return { force, dryRun, only };
}

async function generateOne(apiKey, manifest, entry) {
  const prompt = buildPrompt(manifest, entry);
  const dest = rawJpgPath(entry.file);

  if (entry.reference) {
    const refPath = resolveReference(entry.reference);
    console.log(`  edit ← ${path.basename(refPath)}`);
    const buf = await xaiEdit(apiKey, prompt, refPath);
    saveJpeg(buf, dest);
  } else {
    console.log('  generate (no reference)');
    const buf = await xaiGenerate(apiKey, prompt);
    saveJpeg(buf, dest);
  }

  console.log(`  ✓ ${dest}`);
}

async function main() {
  const { force, dryRun, only } = parseArgs(process.argv.slice(2));
  const apiKey = requireXaiApiKey();
  const manifest = loadManifest();
  let order = topoSort(flattenEntries(manifest));

  if (only) {
    order = order.filter((e) => only.has(e.key) || only.has(e.fieldSize) || only.has(e.variant));
  }

  ensureDir(RAW_CACHE_DIR);

  console.log(`Mannequin generation: ${order.length} images (dry-run=${dryRun}, force=${force})`);
  for (const entry of order) {
    const dest = rawJpgPath(entry.file);
    const label = entry.key || entry.file;
    console.log(`\n[${label}]`);

    if (!force && fs.existsSync(dest)) {
      console.log(`  skip (exists)`);
      continue;
    }

    if (dryRun) {
      console.log(`  would write ${dest}`);
      continue;
    }

    await generateOne(apiKey, manifest, entry);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  console.log('\nDone. Run: npm run stock:matte');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});