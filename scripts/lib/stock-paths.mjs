import fs from 'fs';
import path from 'path';
import { ROOT } from './env.mjs';

export const STOCK_DIR = path.join(ROOT, 'public/stock');
export const RAW_CACHE_DIR = path.join(ROOT, 'scripts/.cache/cutouts-raw');
export const MANIFEST_PATH = path.join(ROOT, 'scripts/subject-cutout-prompts.json');

export const TARGET_W = 1280;
export const TARGET_H = 720;

export function stockPath(rel) {
  return path.join(STOCK_DIR, rel);
}

export function rawJpgPath(relPng) {
  return path.join(RAW_CACHE_DIR, relPng.replace(/\.png$/i, '.jpg'));
}

/** Resolve a manifest reference to a local image file. */
export function resolveReference(ref) {
  if (!ref) return null;

  const candidates = [
    rawJpgPath(ref),
    stockPath(ref),
    stockPath(ref.replace(/\.png$/i, '.jpg')),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  throw new Error(`Reference not found: ${ref} (tried ${candidates.join(', ')})`);
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}