#!/usr/bin/env node
/**
 * Generate prosumer GUI tile textures via xAI → public/textures/gui/
 * Usage:
 *   npm run textures:gui
 *   npm run textures:gui -- --only=toolbar-matte,inset-well
 *   npm run textures:gui -- --force
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { requireXaiApiKey } from './lib/env.mjs';
import { xaiGenerate } from './lib/xai-image.mjs';

const PROMPTS_PATH = path.join(process.cwd(), 'public/stock/app-styling/gui-textures-prompts.json');
const DELAY_MS = Number(process.env.XAI_REQUEST_DELAY_MS || 2500);
const TARGET_SIZE = 512;

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

function publicPath(relativeFile) {
  return path.join(process.cwd(), 'public', relativeFile);
}

async function writeTexture(buf, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  await sharp(buf)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90 })
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

async function generateOne(apiKey, sample, spec) {
  const dest = publicPath(sample.file);
  const prompt = sample.prompt?.trim();
  if (!prompt) throw new Error(`Sample ${sample.id} missing prompt`);

  const buf = await withRetries(sample.id, async () => {
    console.log('  generate');
    return xaiGenerate(apiKey, prompt, {
      model: spec.grokModel,
      aspectRatio: spec.grokAspectRatio || '1:1',
      resolution: spec.grokResolution || '1k',
    });
  });

  await writeTexture(buf, dest);
  console.log(`  ✓ ${dest}`);
}

async function main() {
  const { force, dryRun, only } = parseArgs(process.argv.slice(2));
  const apiKey = requireXaiApiKey();
  const prompts = loadPrompts();
  const spec = prompts.outputSpec ?? {};

  let samples = prompts.samples ?? [];
  if (only) {
    samples = samples.filter((s) => only.has(s.id) || only.has(path.basename(s.file, '.jpg')));
  }

  if (!samples.length) {
    throw new Error('No GUI texture samples matched filters');
  }

  console.log(`GUI textures: ${samples.length} images (dry-run=${dryRun}, force=${force})`);

  for (const sample of samples) {
    const dest = publicPath(sample.file);
    console.log(`\n[${sample.id}] ${sample.file}`);

    if (!force && fs.existsSync(dest)) {
      console.log('  skip (exists)');
      continue;
    }

    if (dryRun) {
      console.log(`  would write ${dest}`);
      continue;
    }

    await generateOne(apiKey, sample, spec);
    if (DELAY_MS > 0) await sleep(DELAY_MS);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});