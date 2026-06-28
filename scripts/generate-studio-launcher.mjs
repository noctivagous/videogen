#!/usr/bin/env node
/**
 * Generate studio launcher card JPGs from public/stock/app-styling/studio-launcher-prompts.json via xAI.
 * Usage:
 *   npm run stock:studio-launcher
 *   npm run stock:studio-launcher -- --only=shot-designer,settings
 *   npm run stock:studio-launcher -- --force
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { requireXaiApiKey } from './lib/env.mjs';
import { ensureDir, resolveReference, stockPath } from './lib/stock-paths.mjs';
import { xaiEdit, xaiGenerate } from './lib/xai-image.mjs';

const PROMPTS_PATH = path.join(process.cwd(), 'public/stock/app-styling/studio-launcher-prompts.json');
const DELAY_MS = Number(process.env.XAI_REQUEST_DELAY_MS || 2500);
const TARGET_W = 640;
const TARGET_H = 280;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadPrompts() {
  return JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
}

function parseArgs(argv) {
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run');
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  return {
    force,
    dryRun,
    only: onlyArg ? new Set(onlyArg.slice(7).split(',').map((s) => s.trim())) : null,
  };
}

function topoSort(samples) {
  const byFile = new Map(samples.map((s) => [s.file, s]));
  const inDegree = new Map(samples.map((s) => [s.file, 0]));
  const dependents = new Map(samples.map((s) => [s.file, []]));

  for (const sample of samples) {
    const ref = sample.referenceFile;
    if (!ref || !byFile.has(ref)) continue;
    inDegree.set(sample.file, (inDegree.get(sample.file) || 0) + 1);
    dependents.get(ref).push(sample.file);
  }

  const queue = samples
    .filter((s) => (inDegree.get(s.file) || 0) === 0)
    .map((s) => s.file);
  const order = [];

  while (queue.length) {
    const file = queue.shift();
    const sample = byFile.get(file);
    if (sample) order.push(sample);
    for (const next of dependents.get(file) || []) {
      inDegree.set(next, inDegree.get(next) - 1);
      if (inDegree.get(next) === 0) queue.push(next);
    }
  }

  if (order.length !== samples.length) {
    const missing = samples
      .filter((s) => !order.find((o) => o.file === s.file))
      .map((s) => s.file);
    throw new Error(`Prompt dependency cycle or unresolved refs: ${missing.join(', ')}`);
  }

  return order;
}

function matchesOnly(sample, only) {
  if (!only) return true;
  const stem = path.basename(sample.file, path.extname(sample.file));
  return only.has(sample.id) || only.has(stem) || only.has(sample.abbr);
}

async function writeLauncher(buf, destPath) {
  ensureDir(path.dirname(destPath));
  await sharp(buf)
    .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'right' })
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

async function generateOne(apiKey, sample) {
  const dest = stockPath(sample.file);
  const prompt = sample.prompt?.trim();
  if (!prompt) throw new Error(`Sample ${sample.id} missing prompt`);

  const buf = await withRetries(sample.abbr || sample.id, async () => {
    if (sample.referenceFile) {
      const refPath = resolveReference(sample.referenceFile);
      console.log(`  edit ← ${path.basename(refPath)}`);
      return xaiEdit(apiKey, prompt, refPath);
    }
    console.log('  generate (no reference)');
    return xaiGenerate(apiKey, prompt);
  });

  await writeLauncher(buf, dest);
  console.log(`  ✓ ${dest}`);
}

async function main() {
  const { force, dryRun, only } = parseArgs(process.argv.slice(2));
  const apiKey = requireXaiApiKey();
  const prompts = loadPrompts();

  let samples = prompts.samples ?? [];
  if (only) {
    samples = samples.filter((s) => matchesOnly(s, only));
  }

  if (!samples.length) {
    throw new Error('No studio launcher samples matched filters');
  }

  const order = topoSort(samples);
  console.log(
    `Studio launcher: ${order.length} images (dry-run=${dryRun}, force=${force})`,
  );

  for (const sample of order) {
    const dest = stockPath(sample.file);
    const label = sample.abbr || sample.id;
    console.log(`\n[${label}] ${sample.file}`);

    if (!force && fs.existsSync(dest)) {
      console.log('  skip (exists)');
      continue;
    }

    if (dryRun) {
      console.log(`  would write ${dest}`);
      continue;
    }

    await generateOne(apiKey, sample);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});