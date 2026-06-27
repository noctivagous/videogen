import { loadMannequinImage } from '@/lib/constants/mannequin-assets';
import { mannequinDrawLayout } from '@/lib/studio/mannequin-layout';
import {
  getBackdropFraming,
  getEffectiveBackdropSourceUrl,
  renderBackdropCropBlob,
} from '@/lib/studio/backdrop-framing';
import { parseResolution } from '@/lib/studio/generation/adapters/shared';
import { buildIdentityPassPlan } from '@/lib/studio/bake-identity-pass';
import { CROWD_DENSITY_PROMPT_LABELS } from '@/lib/constants/crowd-density-options';
import { ARRANGEMENT_PROMPT_LABELS } from '@/lib/constants/arrangement-options';
import type { AspectRatio, LightingSettings, Mannequin, Shot } from '@/lib/types/studio';

export interface BakeFrameOutput {
  backdropBlob: Blob;
  /** Backdrop with gray mannequin figures composited — input for xAI image edit. */
  compositeBlob: Blob;
  maskBlob: Blob;
  width: number;
  height: number;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export async function bakeBlobsToDataUrls(output: BakeFrameOutput): Promise<{
  imageUrl: string;
  compositeUrl: string;
  maskUrl: string;
}> {
  const [imageUrl, compositeUrl, maskUrl] = await Promise.all([
    blobToDataUrl(output.backdropBlob),
    blobToDataUrl(output.compositeBlob),
    blobToDataUrl(output.maskBlob),
  ]);
  return { imageUrl, compositeUrl, maskUrl };
}

/** Prefer an inline data URL so the baked frame survives reloads and displays reliably. */
export async function persistBakedImageUrl(imageUrl: string): Promise<string> {
  if (
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('blob:') ||
    imageUrl.startsWith('/api/') ||
    imageUrl.startsWith('/stock/') ||
    imageUrl.startsWith('assets/')
  ) {
    return imageUrl;
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return imageUrl;
    return blobToDataUrl(await res.blob());
  } catch {
    return imageUrl;
  }
}

async function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

function drawMannequin(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  mannequin: Mannequin,
  width: number,
  height: number,
  mode: 'silhouette' | 'mask',
) {
  const opacity = mannequin.opacity ?? 1;
  const { width: drawW, height: drawH, offsetX, offsetY } = mannequinDrawLayout(
    width,
    height,
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    mannequin,
  );
  const cx = mannequin.x * width;
  const cy = mannequin.y * height;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(cx, cy);
  ctx.rotate((mannequin.rotation * Math.PI) / 180);
  if (mode === 'mask') {
    ctx.fillStyle = '#ffffff';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(offsetX, offsetY, drawW, drawH);
    ctx.fill();
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    const imageData = ctx.getImageData(offsetX, offsetY, drawW, drawH);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const a = imageData.data[i + 3];
      if (a > 20) {
        imageData.data[i] = 255;
        imageData.data[i + 1] = 255;
        imageData.data[i + 2] = 255;
        imageData.data[i + 3] = 255;
      } else {
        imageData.data[i + 3] = 0;
      }
    }
    ctx.clearRect(offsetX, offsetY, drawW, drawH);
    ctx.putImageData(imageData, offsetX, offsetY);
  } else {
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }
  ctx.restore();
}

export async function renderBakeFrames(input: {
  shot: Shot;
  aspectRatio: AspectRatio;
  resolution: string;
  mannequins: Mannequin[];
}): Promise<BakeFrameOutput> {
  const { shot, aspectRatio, resolution, mannequins } = input;
  const { width, height } = parseResolution(resolution);
  const backdropUrl = getEffectiveBackdropSourceUrl(shot, shot.lighting);
  if (!backdropUrl) throw new Error('Backdrop reference is required before baking');

  const framing = getBackdropFraming(shot, aspectRatio);
  const backdropBlob = await renderBackdropCropBlob({
    sourceUrl: backdropUrl,
    framing,
    outputWidth: width,
    outputHeight: height,
    mime: 'image/png',
  });

  const backdropObjectUrl = URL.createObjectURL(backdropBlob);
  const backdropImg = await loadImageElement(backdropObjectUrl);
  const mannequinImages = await Promise.all(
    mannequins.map((m) => loadMannequinImage(m)),
  );

  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = width;
  compositeCanvas.height = height;
  const compositeCtx = compositeCanvas.getContext('2d');
  if (!compositeCtx) throw new Error('Canvas context unavailable');
  compositeCtx.drawImage(backdropImg, 0, 0, width, height);
  for (let i = 0; i < mannequins.length; i++) {
    drawMannequin(compositeCtx, mannequinImages[i], mannequins[i], width, height, 'silhouette');
  }
  const compositeBlob = await new Promise<Blob>((resolve, reject) => {
    compositeCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to export composite'))),
      'image/png',
    );
  });

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) throw new Error('Canvas context unavailable');
  maskCtx.fillStyle = '#000000';
  maskCtx.fillRect(0, 0, width, height);

  for (let i = 0; i < mannequins.length; i++) {
    drawMannequin(maskCtx, mannequinImages[i], mannequins[i], width, height, 'mask');
  }

  const maskBlob = await new Promise<Blob>((resolve, reject) => {
    maskCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to export mask'))),
      'image/png',
    );
  });

  URL.revokeObjectURL(backdropObjectUrl);

  return { backdropBlob, compositeBlob, maskBlob, width, height };
}

/** Replicate FLUX Fill — mask region only. */
export const BAKE_INPAINT_PROMPT =
  'Photorealistic person standing in relaxed pose, seamless integration with backdrop lighting and shadows, natural skin tones, no text or watermarks';

/** xAI image edit — replaces visible gray mannequin silhouettes (no mask API). */
export const BAKE_XAI_EDIT_PROMPT =
  'Replace every gray mannequin silhouette with a photorealistic person in the exact same pose, position, and scale. Seamless integration with the backdrop lighting and shadows. Natural skin tones. Remove all gray mannequin figures completely. No text or watermarks.';

/** Appends optional shot-level bake prompt additions when non-empty. */
export function appendBakePromptAdditions(
  basePrompt: string,
  additions?: string | null,
): string {
  const extra = additions?.trim();
  if (!extra) return basePrompt;
  return `${basePrompt.trimEnd()} ${extra}`;
}

export function augmentBakePass1Prompt(basePrompt: string, shot: Shot): string {
  const parts = [basePrompt.trimEnd()];
  const { camera } = shot;

  if (['2s', '3s', 'group'].includes(camera.subjectCount)) {
    const arrangement = ARRANGEMENT_PROMPT_LABELS[camera.arrangement];
    if (arrangement) parts.push(arrangement);
  }

  if (camera.subjectCount === 'group' && camera.fillRestWithGenerics) {
    parts.push('Fill remaining figures with generic background people, varied outfits');
  }

  if (camera.subjectCount === 'crowd') {
    parts.push(CROWD_DENSITY_PROMPT_LABELS[camera.crowdDensity]);
    const crowdType = shot.crowdTypePrompt?.trim();
    if (crowdType) parts.push(crowdType);
  }

  const atmo = shot.lightingAtmospherePrompt?.trim();
  if (atmo) parts.push(atmo);

  return parts.filter(Boolean).join(' ');
}

export function resolveBakeStartFramePass1Prompt(shot: {
  promptAdditions?: string | null;
  bakeStartFramePrompt?: string | null;
  camera?: Shot['camera'];
  crowdTypePrompt?: string | null;
}): string {
  const override = shot.bakeStartFramePrompt?.trim();
  let base: string;
  if (override) {
    const pass1Match = override.match(/^Pass 1[^\n]*\n([\s\S]*?)(?:\n\nPass \d|$)/);
    base = pass1Match ? pass1Match[1].trim() : override;
  } else {
    base = appendBakePromptAdditions(BAKE_XAI_EDIT_PROMPT, shot.promptAdditions);
  }

  if (shot.camera) {
    return augmentBakePass1Prompt(base, shot as Shot);
  }
  return base;
}

export function buildBakeStartFramePromptPreview(
  shot: Shot,
  lighting?: LightingSettings,
): string {
  const pass1 = resolveBakeStartFramePass1Prompt(shot);
  const sections = [`Pass 1 — Silhouette edit\n${pass1}`];
  const plan = buildIdentityPassPlan(shot, '<scene>', lighting ?? shot.lighting);
  if (plan) {
    plan.passes.forEach((spec, index) => {
      sections.push(
        `Pass ${index + 2} — Identity\n${appendBakePromptAdditions(spec.prompt, shot.promptAdditions)}`,
      );
    });
  }
  return sections.join('\n\n');
}