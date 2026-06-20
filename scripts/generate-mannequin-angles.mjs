#!/usr/bin/env node
/**
 * Mannequin angle assets for lock-start-frame / mannequin mode.
 *
 * Preferred workflow (stock-style art):
 *   1. Generate 6 raw JPGs with the Imagine skill (image_gen / GenerateImage)
 *      — front anchor first, then 3/4 left/right, profiles, back.
 *   2. Copy raws to scripts/.cache/mannequin-angles-raw/{front,three-quarter-left,...}.jpg
 *   3. npm run stock:process-mannequin-angles  (RMBG matte + alpha trim)
 *
 * Offline SVG fallback (primitive placeholders only):
 *   node scripts/generate-mannequin-angles.mjs --svg-fallback
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/mannequins');
const TRIM_ASSETS_PATH = path.join(ROOT, 'lib/constants/mannequin-assets.ts');
const SIZE = 1024;
const TRIM_PAD = 6;

const C = {
  body: '#7a7a7a',
  mid: '#868686',
  dark: '#5f5f5f',
  light: '#9a9a9a',
  spine: '#6e6e6e',
};

function svgOpen() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">`;
}

function svgClose() {
  return '</svg>';
}

const FEET_Y = 748;

function footPair(cx, spread = 36, w = 34, h = 14) {
  const y = FEET_Y - h;
  return `
    <rect x="${cx - spread - w / 2}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.body}"/>
    <rect x="${cx + spread - w / 2}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.body}"/>
  `;
}

function bodyFront() {
  const cx = 512;
  return `${svgOpen()}
    <ellipse cx="${cx}" cy="168" rx="58" ry="70" fill="${C.body}"/>
    <ellipse cx="${cx}" cy="158" rx="48" ry="52" fill="${C.light}" opacity="0.35"/>
    <rect x="${cx - 22}" y="228" width="44" height="36" rx="14" fill="${C.mid}"/>
    <path d="M ${cx - 88} 262 Q ${cx - 96} 320 ${cx - 78} 380 L ${cx - 62} 500 Q ${cx - 58} 560 ${cx - 54} 620 L ${cx - 48} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="46" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 88} 262 Q ${cx + 96} 320 ${cx + 78} 380 L ${cx + 62} 500 Q ${cx + 58} 560 ${cx + 54} 620 L ${cx + 48} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="46" stroke-linecap="round" fill="none"/>
    <path d="M ${cx - 72} 268 Q ${cx - 18} 250 ${cx + 72} 268 L ${cx + 68} 470 Q ${cx} 490 ${cx - 68} 470 Z" fill="${C.body}"/>
    <ellipse cx="${cx}" cy="340" rx="34" ry="52" fill="${C.light}" opacity="0.22"/>
    <path d="M ${cx - 34} 470 L ${cx - 30} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="40" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 34} 470 L ${cx + 30} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="40" stroke-linecap="round" fill="none"/>
    ${footPair(cx)}
  ${svgClose()}`;
}

function bodyThreeQuarterLeft() {
  const cx = 538;
  return `${svgOpen()}
    <ellipse cx="${cx + 18}" cy="170" rx="54" ry="68" fill="${C.body}"/>
    <rect x="${cx - 10}" y="232" width="40" height="34" rx="12" fill="${C.mid}"/>
    <path d="M ${cx - 20} 266 Q ${cx + 8} 290 ${cx + 42} 318 L ${cx + 58} 430 Q ${cx + 52} 500 ${cx + 44} 590 L ${cx + 36} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="42" stroke-linecap="round" fill="none"/>
    <path d="M ${cx - 70} 280 Q ${cx - 92} 360 ${cx - 64} 450 L ${cx - 52} 560 L ${cx - 44} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="36" stroke-linecap="round" fill="none"/>
    <path d="M ${cx - 8} 270 Q ${cx + 36} 258 ${cx + 58} 286 L ${cx + 48} 468 Q ${cx + 10} 488 ${cx - 24} 462 Z" fill="${C.body}"/>
    <path d="M ${cx - 6} 468 L ${cx - 2} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="36" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 30} 468 L ${cx + 26} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="34" stroke-linecap="round" fill="none"/>
    ${footPair(cx + 4, 30, 30, 12)}
  ${svgClose()}`;
}

function bodyThreeQuarterRight() {
  const cx = 486;
  return `${svgOpen()}
    <ellipse cx="${cx - 18}" cy="170" rx="54" ry="68" fill="${C.body}"/>
    <rect x="${cx - 30}" y="232" width="40" height="34" rx="12" fill="${C.mid}"/>
    <path d="M ${cx + 20} 266 Q ${cx - 8} 290 ${cx - 42} 318 L ${cx - 58} 430 Q ${cx - 52} 500 ${cx - 44} 590 L ${cx - 36} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="42" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 70} 280 Q ${cx + 92} 360 ${cx + 64} 450 L ${cx + 52} 560 L ${cx + 44} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="36" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 8} 270 Q ${cx - 36} 258 ${cx - 58} 286 L ${cx - 48} 468 Q ${cx - 10} 488 ${cx + 24} 462 Z" fill="${C.body}"/>
    <path d="M ${cx + 6} 468 L ${cx + 2} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="36" stroke-linecap="round" fill="none"/>
    <path d="M ${cx - 30} 468 L ${cx - 26} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="34" stroke-linecap="round" fill="none"/>
    ${footPair(cx - 4, 30, 30, 12)}
  ${svgClose()}`;
}

function bodyLeftProfile() {
  const cx = 598;
  return `${svgOpen()}
    <ellipse cx="${cx + 8}" cy="172" rx="42" ry="66" fill="${C.body}"/>
    <rect x="${cx - 34}" y="234" width="52" height="34" rx="12" fill="${C.mid}"/>
    <path d="M ${cx - 48} 280 Q ${cx - 72} 360 ${cx - 56} 450 L ${cx - 48} 560 L ${cx - 42} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="34" stroke-linecap="round" fill="none"/>
    <rect x="${cx - 40}" y="268" width="72" height="210" rx="28" fill="${C.body}"/>
    <rect x="${cx - 8}" y="300" width="18" height="150" rx="8" fill="${C.dark}" opacity="0.35"/>
    <path d="M ${cx - 18} 470 L ${cx - 14} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="34" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 10} 470 L ${cx + 8} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="30" stroke-linecap="round" fill="none"/>
    ${footPair(cx - 6, 22, 28, 12)}
  ${svgClose()}`;
}

function bodyRightProfile() {
  const cx = 426;
  return `${svgOpen()}
    <ellipse cx="${cx - 8}" cy="172" rx="42" ry="66" fill="${C.body}"/>
    <rect x="${cx - 18}" y="234" width="52" height="34" rx="12" fill="${C.mid}"/>
    <path d="M ${cx + 48} 280 Q ${cx + 72} 360 ${cx + 56} 450 L ${cx + 48} 560 L ${cx + 42} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="34" stroke-linecap="round" fill="none"/>
    <rect x="${cx - 32}" y="268" width="72" height="210" rx="28" fill="${C.body}"/>
    <rect x="${cx - 10}" y="300" width="18" height="150" rx="8" fill="${C.dark}" opacity="0.35"/>
    <path d="M ${cx + 18} 470 L ${cx + 14} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="34" stroke-linecap="round" fill="none"/>
    <path d="M ${cx - 10} 470 L ${cx - 8} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="30" stroke-linecap="round" fill="none"/>
    ${footPair(cx + 6, 22, 28, 12)}
  ${svgClose()}`;
}

function bodyBack() {
  const cx = 512;
  return `${svgOpen()}
    <ellipse cx="${cx}" cy="168" rx="60" ry="70" fill="${C.body}"/>
    <rect x="${cx - 24}" y="228" width="48" height="36" rx="14" fill="${C.mid}"/>
    <path d="M ${cx - 86} 262 Q ${cx - 94} 320 ${cx - 76} 380 L ${cx - 60} 500 Q ${cx - 56} 560 ${cx - 52} 620 L ${cx - 46} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="44" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 86} 262 Q ${cx + 94} 320 ${cx + 76} 380 L ${cx + 60} 500 Q ${cx + 56} 560 ${cx + 52} 620 L ${cx + 46} ${FEET_Y - 8}"
      stroke="${C.body}" stroke-width="44" stroke-linecap="round" fill="none"/>
    <path d="M ${cx - 70} 268 Q ${cx - 16} 248 ${cx + 70} 268 L ${cx + 66} 470 Q ${cx} 492 ${cx - 66} 470 Z" fill="${C.body}"/>
    <rect x="${cx - 44}" y="300" width="88" height="22" rx="8" fill="${C.spine}"/>
    <rect x="${cx - 10}" y="322" width="20" height="130" rx="6" fill="${C.dark}" opacity="0.3"/>
    <path d="M ${cx - 32} 470 L ${cx - 28} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="38" stroke-linecap="round" fill="none"/>
    <path d="M ${cx + 32} 470 L ${cx + 28} ${FEET_Y - 6}" stroke="${C.body}" stroke-width="38" stroke-linecap="round" fill="none"/>
    ${footPair(cx)}
  ${svgClose()}`;
}

const ANGLES = [
  { file: 'front.png', key: 'front', body: bodyFront },
  { file: 'three-quarter-left.png', key: 'threeQuarterLeft', body: bodyThreeQuarterLeft },
  { file: 'three-quarter-right.png', key: 'threeQuarterRight', body: bodyThreeQuarterRight },
  { file: 'left-profile.png', key: 'left', body: bodyLeftProfile },
  { file: 'right-profile.png', key: 'right', body: bodyRightProfile },
  { file: 'back.png', key: 'back', body: bodyBack },
];

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

async function renderAngle({ file, body }) {
  const raw = await sharp(Buffer.from(body())).png().toBuffer();
  const trimmed = await sharp(raw)
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

  const outPath = path.join(OUT_DIR, file);
  await sharp(trimmed).toFile(outPath);
  const trim = await measureTrim(trimmed);
  console.log('Wrote', outPath, `${trim.width}x${trim.height}`, trim);
  return { file, trim };
}

function formatTrimBlock(results) {
  const byKey = Object.fromEntries(ANGLES.map((a, i) => [a.key, results[i].trim]));
  const lines = Object.entries(byKey).map(([key, t]) => {
    return `  ${key}: { paddingBottom: ${t.paddingBottom}, paddingTop: ${t.paddingTop}, contentHeightRatio: ${t.contentHeightRatio}, feetCenterX: ${t.feetCenterX} },`;
  });
  return `const MANNEQUIN_TRIM: Record<MannequinAngle, MannequinTrim> = {\n${lines.join('\n')}\n};`;
}

function patchTrimAssets(results) {
  const src = fs.readFileSync(TRIM_ASSETS_PATH, 'utf8');
  const block = formatTrimBlock(results);
  const next = src.replace(
    /const MANNEQUIN_TRIM: Record<MannequinAngle, MannequinTrim> = \{[\s\S]*?\};/,
    block,
  );
  if (next === src) {
    console.warn('Warning: could not patch mannequin-assets.ts trim block');
    return;
  }
  fs.writeFileSync(TRIM_ASSETS_PATH, next);
  console.log('Updated', TRIM_ASSETS_PATH);
}

async function runSvgFallback() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = await Promise.all(ANGLES.map(renderAngle));
  patchTrimAssets(results);
  console.log('Done — 6 SVG placeholder mannequins in public/mannequins/');
}

function printWorkflow() {
  console.log(`Mannequin angle generation workflow:

  1. Generate raw JPGs with Imagine (image_gen / GenerateImage):
     front, three-quarter-left, three-quarter-right,
     left-profile, right-profile, back

  2. Copy into scripts/.cache/mannequin-angles-raw/:
     front.jpg, three-quarter-left.jpg, three-quarter-right.jpg,
     left-profile.jpg, right-profile.jpg, back.jpg

  3. npm run stock:process-mannequin-angles

  Offline SVG placeholders only:
     node scripts/generate-mannequin-angles.mjs --svg-fallback
`);
}

if (process.argv.includes('--svg-fallback')) {
  await runSvgFallback();
} else {
  printWorkflow();
}