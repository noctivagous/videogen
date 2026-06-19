#!/usr/bin/env node
/**
 * Generate cinematography preview JPGs from public/stock/prompts.json samples via xAI.
 * Usage:
 *   npm run stock:previews -- --section=subjectCounts
 *   npm run stock:previews -- --only=1s,2s
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { requireXaiApiKey } from './lib/env.mjs';
import { ensureDir, resolveReference, stockPath } from './lib/stock-paths.mjs';
import { xaiEdit, xaiGenerate } from './lib/xai-image.mjs';

const PROMPTS_PATH = path.join(process.cwd(), 'public/stock/prompts.json');
const DELAY_MS = Number(process.env.XAI_REQUEST_DELAY_MS || 2500);
const TARGET_W = 640;
const TARGET_H = 360;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadPrompts() {
  return JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf8'));
}

function parseArgs(argv) {
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run');
  const sectionArg = argv.find((a) => a.startsWith('--section='));
  const onlyArg = argv.find((a) => a.startsWith('--only='));
  return {
    force,
    dryRun,
    section: sectionArg?.slice(10),
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
  const abbr = sample.abbr?.toLowerCase();
  const stem = path.basename(sample.file, path.extname(sample.file));
  return only.has(sample.id) || only.has(stem) || only.has(abbr) || only.has(sample.abbr);
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

  await writePreview(buf, dest);
  console.log(`  ✓ ${dest}`);
}

async function main() {
  const { force, dryRun, section, only } = parseArgs(process.argv.slice(2));
  const apiKey = requireXaiApiKey();
  const prompts = loadPrompts();

  let samples = prompts.samples ?? [];
  if (section) {
    samples = samples.filter((s) => s.sectionKey === section);
  }
  if (only) {
    samples = samples.filter((s) => matchesOnly(s, only));
  }

  if (!samples.length) {
    throw new Error(section ? `No samples for section "${section}"` : 'No samples matched filters');
  }

  const order = topoSort(samples);
  console.log(`Stock previews: ${order.length} images (section=${section ?? 'all'}, dry-run=${dryRun}, force=${force})`);

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