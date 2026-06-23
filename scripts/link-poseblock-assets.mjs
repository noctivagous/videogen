#!/usr/bin/env node
/**
 * Expose PoseBlock GLB assets at public/poseblock-models for VideoGen's Next.js server.
 *
 * PoseBlock stores models under PoseBlock/public/models; VideoGen only serves public/.
 * Run automatically via postinstall; safe to re-run (idempotent).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'PoseBlock', 'public', 'models');
const target = path.join(root, 'public', 'poseblock-models');

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function removeTarget() {
  if (!exists(target)) return;
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || stat.isFile()) {
    fs.unlinkSync(target);
  } else if (stat.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function linkOrCopy() {
  if (!exists(source)) {
    console.warn(
      '[poseblock-assets] Skipped: PoseBlock/public/models not found.\n' +
        '  Run: git submodule update --init --recursive',
    );
    return;
  }

  removeTarget();

  try {
    fs.symlinkSync(source, target, 'dir');
    console.log('[poseblock-assets] Linked public/poseblock-models → PoseBlock/public/models');
    return;
  } catch (err) {
    console.warn('[poseblock-assets] Symlink failed, copying instead:', err.message);
  }

  fs.cpSync(source, target, { recursive: true });
  console.log('[poseblock-assets] Copied PoseBlock/public/models → public/poseblock-models');
}

linkOrCopy();
