import { normalizeReferenceRole } from '@/lib/constants/camera';
import { resolveReferenceDisplayUrl } from '@/lib/storage/reference-url';
import { effectiveReferenceUrl } from '@/lib/studio/theme-transform';
import {
  defaultBackdropUpscaler,
  type BackdropUpscaler,
} from '@/lib/studio/backdrop-upscale';
import type { CSSProperties } from 'react';
import type {
  AspectRatio,
  BackdropCropStatus,
  BackdropFraming,
  LightingSettings,
  ReferenceRole,
  Shot,
} from '@/lib/types/studio';

export const DEFAULT_BACKDROP_FRAMING: BackdropFraming = {
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  skewX: 0,
  skewY: 0,
  perspective: 0,
  locked: false,
};

const TRANSFORM_PATCH_KEYS = new Set([
  'scale',
  'scaleX',
  'scaleY',
  'offsetX',
  'offsetY',
  'rotation',
  'skewX',
  'skewY',
  'perspective',
]);

export function isBackdropTransformPatch(patch: Partial<BackdropFraming>): boolean {
  return Object.keys(patch).some((key) => TRANSFORM_PATCH_KEYS.has(key));
}

export function getBackdropSlotIndexFromRoles(roles: ReferenceRole[] | undefined): number {
  const list = roles ?? [];
  for (let i = 0; i < list.length; i++) {
    const role = normalizeReferenceRole(list[i] ?? 'None');
    if (role === 'Backdrop' || role === 'Depth') return i;
  }
  return -1;
}

export function getBackdropSlotIndex(shot: Shot | undefined): number {
  if (!shot) return -1;
  return getBackdropSlotIndexFromRoles(shot.referenceRoles);
}

export function getEffectiveBackdropSourceUrl(
  shot: Shot | undefined,
  lighting?: LightingSettings,
): string | null {
  if (!shot) return null;
  const index = getBackdropSlotIndex(shot);
  if (index < 0) return null;
  const resolvedLighting = lighting ?? shot.lighting;
  const raw = effectiveReferenceUrl(shot, index, resolvedLighting) ?? shot.references[index];
  return raw ? resolveReferenceDisplayUrl(raw) : null;
}

export function getBackdropCropStatus(
  shot: Shot | undefined,
  aspectRatio: AspectRatio,
): BackdropCropStatus {
  return shot?.backdropCropStatusByAspect?.[aspectRatio] ?? 'none';
}

export function isBackdropCropCommitted(
  shot: Shot | undefined,
  aspectRatio: AspectRatio,
): boolean {
  const framing = getBackdropFraming(shot, aspectRatio);
  return framing.locked && getBackdropCropStatus(shot, aspectRatio) === 'ready';
}

/** Preview URL: committed crop when locked+ready, otherwise live source. */
export function getBackdropPreviewUrl(
  shot: Shot | undefined,
  aspectRatio: AspectRatio,
  lighting?: LightingSettings,
): string | null {
  if (isBackdropCropCommitted(shot, aspectRatio)) {
    const crop = shot?.backdropCropsByAspect?.[aspectRatio];
    if (crop) return resolveReferenceDisplayUrl(crop);
  }
  return getEffectiveBackdropSourceUrl(shot, lighting);
}

/** Cropped backdrop for API calls when available; otherwise theme-transformed source. */
export function getEffectiveBackdropApiUrl(
  shot: Shot | undefined,
  aspectRatio: AspectRatio,
  lighting?: LightingSettings,
): string | null {
  const crop = shot?.backdropCropsByAspect?.[aspectRatio];
  if (crop) return resolveReferenceDisplayUrl(crop);
  return getEffectiveBackdropSourceUrl(shot, lighting);
}

function clampFraming(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function panFramingByPixelDelta(
  framing: BackdropFraming,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  deltaX: number,
  deltaY: number,
): Pick<BackdropFraming, 'offsetX' | 'offsetY'> {
  const rect = computeBackdropDrawRect(framing, imageWidth, imageHeight, frameWidth, frameHeight);
  const maxPanX = Math.max(0, (rect.width - frameWidth) / 2);
  const maxPanY = Math.max(0, (rect.height - frameHeight) / 2);
  return {
    offsetX: maxPanX > 0 ? clampFraming(framing.offsetX + deltaX / maxPanX, -1, 1) : 0,
    offsetY: maxPanY > 0 ? clampFraming(framing.offsetY + deltaY / maxPanY, -1, 1) : 0,
  };
}

export function scaleFramingFromWheel(
  framing: BackdropFraming,
  deltaY: number,
): Pick<BackdropFraming, 'scale'> {
  const factor = deltaY > 0 ? 0.92 : 1.08;
  return { scale: clampFraming(framing.scale * factor, 0.25, 4) };
}

export type BackdropHandleKind =
  | 'move'
  | 'corner-tl'
  | 'corner-tr'
  | 'corner-bl'
  | 'corner-br'
  | 'rotate'
  | 'skew-x'
  | 'skew-y'
  | 'perspective';

type BackdropCorner = 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br';

function oppositeCorner(corner: BackdropCorner): BackdropCorner {
  switch (corner) {
    case 'corner-tl':
      return 'corner-br';
    case 'corner-tr':
      return 'corner-bl';
    case 'corner-bl':
      return 'corner-tr';
    case 'corner-br':
      return 'corner-tl';
  }
}

function cornerPoint(
  rect: BackdropDrawRect,
  corner: BackdropCorner,
): { x: number; y: number } {
  switch (corner) {
    case 'corner-tl':
      return { x: rect.x, y: rect.y };
    case 'corner-tr':
      return { x: rect.x + rect.width, y: rect.y };
    case 'corner-bl':
      return { x: rect.x, y: rect.y + rect.height };
    case 'corner-br':
      return { x: rect.x + rect.width, y: rect.y + rect.height };
  }
}

function centerFromAnchoredCorner(
  anchor: { x: number; y: number },
  anchorCorner: BackdropCorner,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (anchorCorner) {
    case 'corner-tl':
      return { x: anchor.x + width / 2, y: anchor.y + height / 2 };
    case 'corner-tr':
      return { x: anchor.x - width / 2, y: anchor.y + height / 2 };
    case 'corner-bl':
      return { x: anchor.x + width / 2, y: anchor.y - height / 2 };
    case 'corner-br':
      return { x: anchor.x - width / 2, y: anchor.y - height / 2 };
  }
}

function offsetsFromDrawCenter(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  frameWidth: number,
  frameHeight: number,
): Pick<BackdropFraming, 'offsetX' | 'offsetY'> {
  const maxPanX = Math.max(0, (width - frameWidth) / 2);
  const maxPanY = Math.max(0, (height - frameHeight) / 2);
  return {
    offsetX: maxPanX > 0 ? clampFraming((centerX - frameWidth / 2) / maxPanX, -1, 1) : 0,
    offsetY: maxPanY > 0 ? clampFraming((centerY - frameHeight / 2) / maxPanY, -1, 1) : 0,
  };
}

/** Scale from dragged corner; opposite corner stays fixed. Uniform unless shiftKey. */
export function resizeFramingFromCornerAnchored(
  framing: BackdropFraming,
  corner: BackdropCorner,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  deltaX: number,
  deltaY: number,
  uniform: boolean,
): Partial<BackdropFraming> {
  const rect = computeBackdropDrawRect(framing, imageWidth, imageHeight, frameWidth, frameHeight);
  const sensitivity = 0.003;
  const dx = corner === 'corner-tr' || corner === 'corner-br' ? deltaX : -deltaX;
  const dy = corner === 'corner-bl' || corner === 'corner-br' ? deltaY : -deltaY;
  const anchorCorner = oppositeCorner(corner);
  const anchor = cornerPoint(rect, anchorCorner);

  if (uniform) {
    const delta = ((dx + dy) / 2) * sensitivity;
    const newScale = clampFraming(framing.scale + delta, 0.25, 4);
    const ratio = framing.scale > 0 ? newScale / framing.scale : 1;
    const newWidth = rect.width * ratio;
    const newHeight = rect.height * ratio;
    const center = centerFromAnchoredCorner(anchor, anchorCorner, newWidth, newHeight);
    return {
      scale: newScale,
      ...offsetsFromDrawCenter(center.x, center.y, newWidth, newHeight, frameWidth, frameHeight),
    };
  }

  const newScaleX = clampFraming(framing.scaleX + dx * sensitivity, 0.25, 4);
  const newScaleY = clampFraming(framing.scaleY + dy * sensitivity, 0.25, 4);
  const widthRatio = framing.scaleX > 0 ? newScaleX / framing.scaleX : 1;
  const heightRatio = framing.scaleY > 0 ? newScaleY / framing.scaleY : 1;
  const newWidth = rect.width * widthRatio;
  const newHeight = rect.height * heightRatio;
  const center = centerFromAnchoredCorner(anchor, anchorCorner, newWidth, newHeight);
  return {
    scaleX: newScaleX,
    scaleY: newScaleY,
    ...offsetsFromDrawCenter(center.x, center.y, newWidth, newHeight, frameWidth, frameHeight),
  };
}

export function rotateFramingFromDrag(
  framing: BackdropFraming,
  deltaX: number,
  deltaY: number,
): Pick<BackdropFraming, 'rotation'> {
  return { rotation: framing.rotation + (deltaX - deltaY) * 0.4 };
}

export function skewFramingFromDrag(
  framing: BackdropFraming,
  axis: 'skew-x' | 'skew-y',
  deltaX: number,
  deltaY: number,
): Partial<Pick<BackdropFraming, 'skewX' | 'skewY'>> {
  const delta = axis === 'skew-x' ? deltaX : deltaY;
  if (axis === 'skew-x') {
    return { skewX: clampFraming(framing.skewX + delta * 0.15, -45, 45) };
  }
  return { skewY: clampFraming(framing.skewY + delta * 0.15, -45, 45) };
}

export function perspectiveFramingFromDrag(
  framing: BackdropFraming,
  deltaY: number,
): Pick<BackdropFraming, 'perspective'> {
  return { perspective: clampFraming(framing.perspective - deltaY * 2, 0, 2000) };
}

export function framingCssTransform(
  framing: BackdropFraming,
  offsetX: number,
  offsetY: number,
): string {
  const parts = [
    `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
    `rotate(${framing.rotation}deg)`,
    `skew(${framing.skewX}deg, ${framing.skewY}deg)`,
    `scale(${framing.scale * framing.scaleX}, ${framing.scale * framing.scaleY})`,
  ];
  if (framing.perspective > 0) {
    parts.unshift(`perspective(${framing.perspective}px)`);
  }
  return parts.join(' ');
}

/** Canvas matrix matching framingToLayerStyle + framingCssTransform (left/top 50%, origin center). */
export function buildBackdropFramingMatrix(
  framing: BackdropFraming,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): { matrix: DOMMatrix; baseW: number; baseH: number } {
  const baseline = computeCoverBaselineScale(imageWidth, imageHeight, frameWidth, frameHeight);
  const baseW = imageWidth * baseline;
  const baseH = imageHeight * baseline;
  const rect = computeBackdropDrawRect(framing, imageWidth, imageHeight, frameWidth, frameHeight);
  const offsetX = rect.x + rect.width / 2 - frameWidth / 2;
  const offsetY = rect.y + rect.height / 2 - frameHeight / 2;
  const originX = baseW / 2;
  const originY = baseH / 2;

  const matrix = new DOMMatrix()
    .translate(frameWidth / 2, frameHeight / 2)
    .translate(originX, originY);

  if (framing.perspective > 0) {
    matrix.multiplySelf(new DOMMatrix(`perspective(${framing.perspective}px)`));
  }

  matrix
    .translateSelf(-baseW / 2 + offsetX, -baseH / 2 + offsetY)
    .rotateSelf(framing.rotation)
    .skewXSelf(framing.skewX)
    .skewYSelf(framing.skewY)
    .scaleSelf(framing.scale * framing.scaleX, framing.scale * framing.scaleY)
    .translateSelf(-originX, -originY);

  return { matrix, baseW, baseH };
}

export function clearBackdropCropStatus(
  status: Partial<Record<AspectRatio, BackdropCropStatus>> | undefined,
  aspect?: AspectRatio,
): Partial<Record<AspectRatio, BackdropCropStatus>> {
  const next = { ...(status ?? {}) };
  if (aspect) {
    delete next[aspect];
  } else {
    for (const key of Object.keys(next) as AspectRatio[]) {
      delete next[key];
    }
  }
  return next;
}

export function getBackdropFraming(
  shot: Shot | undefined,
  aspectRatio: AspectRatio,
): BackdropFraming {
  const saved = shot?.backdropFramingByAspect?.[aspectRatio];
  return saved ? { ...DEFAULT_BACKDROP_FRAMING, ...saved } : { ...DEFAULT_BACKDROP_FRAMING };
}

export function computeCoverBaselineScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  if (!imageWidth || !imageHeight || !frameWidth || !frameHeight) return 1;
  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
}

export interface BackdropDrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

function inverseRotateSkewPoint(
  px: number,
  py: number,
  rotationDeg: number,
  skewXDeg: number,
  skewYDeg: number,
): { x: number; y: number } {
  const rot = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  let x = px * cos - py * sin;
  let y = px * sin + py * cos;

  const skewX = (skewXDeg * Math.PI) / 180;
  const skewY = (skewYDeg * Math.PI) / 180;
  const tanX = Math.tan(skewX);
  const tanY = Math.tan(skewY);
  const det = 1 - tanX * tanY;
  if (Math.abs(det) > 0.01) {
    const ix = (x - tanY * y) / det;
    const iy = (y - tanX * x) / det;
    x = ix;
    y = iy;
  }
  return { x, y };
}

/** Frame-local point test against the transformed backdrop image bounds. */
export function isPointInBackdropImage(
  framing: BackdropFraming,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  localX: number,
  localY: number,
): boolean {
  const rect = computeBackdropDrawRect(framing, imageWidth, imageHeight, frameWidth, frameHeight);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const local = inverseRotateSkewPoint(
    localX - cx,
    localY - cy,
    framing.rotation,
    framing.skewX,
    framing.skewY,
  );
  return Math.abs(local.x) <= rect.width / 2 && Math.abs(local.y) <= rect.height / 2;
}

export function computeBackdropDrawRect(
  framing: BackdropFraming,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): BackdropDrawRect {
  const baseline = computeCoverBaselineScale(imageWidth, imageHeight, frameWidth, frameHeight);
  const scale = baseline * Math.max(0.25, framing.scale);
  const width = imageWidth * scale * Math.max(0.25, framing.scaleX);
  const height = imageHeight * scale * Math.max(0.25, framing.scaleY);
  const maxPanX = Math.max(0, (width - frameWidth) / 2);
  const maxPanY = Math.max(0, (height - frameHeight) / 2);
  const centerX = frameWidth / 2 + framing.offsetX * maxPanX;
  const centerY = frameHeight / 2 + framing.offsetY * maxPanY;
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    scale,
  };
}

export function framingToLayerStyle(
  framing: BackdropFraming,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
): CSSProperties {
  const rect = computeBackdropDrawRect(framing, imageWidth, imageHeight, frameWidth, frameHeight);
  const offsetX = rect.x + rect.width / 2 - frameWidth / 2;
  const offsetY = rect.y + rect.height / 2 - frameHeight / 2;
  const baseWidthPct =
    (imageWidth / frameWidth) * 100 * computeCoverBaselineScale(imageWidth, imageHeight, frameWidth, frameHeight);

  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: `${baseWidthPct}%`,
    height: 'auto',
    maxWidth: 'none',
    transform: framingCssTransform(framing, offsetX, offsetY),
    transformOrigin: 'center center',
    pointerEvents: 'none',
  };
}

export function needsBackdropUpscale(
  imageWidth: number,
  imageHeight: number,
  outputWidth: number,
  outputHeight: number,
  framing: BackdropFraming,
): boolean {
  const rect = computeBackdropDrawRect(framing, imageWidth, imageHeight, outputWidth, outputHeight);
  return rect.width < outputWidth * 0.98 || rect.height < outputHeight * 0.98;
}

export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load backdrop image'));
    img.src = url;
  });
}

export interface RenderBackdropCropOptions {
  sourceUrl: string;
  framing: BackdropFraming;
  outputWidth: number;
  outputHeight: number;
  upscaler?: BackdropUpscaler;
  mime?: string;
  quality?: number;
}

export async function renderBackdropCropBlob({
  sourceUrl,
  framing,
  outputWidth,
  outputHeight,
  upscaler = defaultBackdropUpscaler,
  mime = 'image/jpeg',
  quality = 0.92,
}: RenderBackdropCropOptions): Promise<Blob> {
  const img = await loadImageElement(sourceUrl);
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  let source: CanvasImageSource = img;
  if (needsBackdropUpscale(naturalW, naturalH, outputWidth, outputHeight, framing)) {
    const upscaleCanvas = await upscaler.upscale(img, naturalW * 2, naturalH * 2);
    source = upscaleCanvas;
  }

  const sourceW = 'width' in source ? (source as HTMLCanvasElement).width : naturalW;
  const sourceH = 'height' in source ? (source as HTMLCanvasElement).height : naturalH;
  const { matrix, baseW, baseH } = buildBackdropFramingMatrix(
    framing,
    sourceW,
    sourceH,
    outputWidth,
    outputHeight,
  );

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.fillStyle = '#242424';
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, outputWidth, outputHeight);
  ctx.clip();
  ctx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
  ctx.drawImage(source, 0, 0, baseW, baseH);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to export backdrop crop'))),
      mime,
      quality,
    );
  });
}

export async function renderBackdropCropDataUrl(
  options: RenderBackdropCropOptions,
): Promise<string> {
  const blob = await renderBackdropCropBlob(options);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read crop blob'));
    reader.readAsDataURL(blob);
  });
}

export function clearBackdropCrops(
  crops: Partial<Record<AspectRatio, string>> | undefined,
  aspect?: AspectRatio,
): Partial<Record<AspectRatio, string>> {
  const next = { ...(crops ?? {}) };
  if (aspect) {
    delete next[aspect];
  } else {
    for (const key of Object.keys(next) as AspectRatio[]) {
      delete next[key];
    }
  }
  return next;
}