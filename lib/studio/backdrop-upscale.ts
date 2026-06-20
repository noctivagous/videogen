export interface BackdropUpscaler {
  upscale(source: CanvasImageSource, targetWidth: number, targetHeight: number): Promise<HTMLCanvasElement>;
}

/** High-quality canvas upscale (2-pass when enlarging). */
export async function canvasHighQualityUpscale(
  source: CanvasImageSource,
  targetWidth: number,
  targetHeight: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(targetWidth));
  canvas.height = Math.max(1, Math.round(targetHeight));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export const defaultBackdropUpscaler: BackdropUpscaler = {
  upscale: canvasHighQualityUpscale,
};