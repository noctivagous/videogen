import { normalizeReferenceRole } from '@/lib/constants/camera';
import { hashBlobContent } from '@/lib/media/media-library';
import type { MediaAsset } from '@/lib/types/media-library';
import type { AspectRatio, CoverageShot, ReferenceRole, Setup, Shot, StudioProject } from '@/lib/types/studio';

export const ASSETS_DIR = 'assets';

const blobUrlByAssetPath = new Map<string, string>();

export function isProjectAssetPath(ref: string): boolean {
  return ref.startsWith(`${ASSETS_DIR}/`);
}

export function isInlineReference(ref: string): boolean {
  return ref.startsWith('data:') || ref.startsWith('blob:');
}

export function shouldExternalizeReference(ref: string | null): boolean {
  return Boolean(ref && isInlineReference(ref));
}

export function getAssetBlobUrl(assetPath: string): string | null {
  return blobUrlByAssetPath.get(assetPath) ?? null;
}

export function revokeProjectAssetUrls(): void {
  for (const url of blobUrlByAssetPath.values()) {
    URL.revokeObjectURL(url);
  }
  blobUrlByAssetPath.clear();
}

function registerAssetBlob(assetPath: string, blob: Blob): string {
  const existing = blobUrlByAssetPath.get(assetPath);
  if (existing) URL.revokeObjectURL(existing);
  const blobUrl = URL.createObjectURL(blob);
  blobUrlByAssetPath.set(assetPath, blobUrl);
  return blobUrl;
}

export function assetPathForReference(
  shotId: number,
  slotIndex: number,
  role: ReferenceRole,
  ext: string,
): string {
  const slug = role.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${ASSETS_DIR}/shot-${String(shotId).padStart(2, '0')}-ref-${slotIndex}-${slug}.${ext}`;
}

export function assetPathForTransformedReference(
  shotId: number,
  slotIndex: number,
  role: ReferenceRole,
  ext: string,
): string {
  const slug = role.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${ASSETS_DIR}/shot-${String(shotId).padStart(2, '0')}-transformed-ref-${slotIndex}-${slug}.${ext}`;
}

export function assetPathForBackdropCrop(
  shotId: number,
  aspectRatio: AspectRatio,
  ext: string,
): string {
  const slug = aspectRatio.replace(':', 'x');
  return `${ASSETS_DIR}/shot-${String(shotId).padStart(2, '0')}-backdrop-crop-${slug}.${ext}`;
}

export function assetPathForMediaAsset(contentHash: string, ext: string): string {
  return `${ASSETS_DIR}/media/${contentHash}.${ext}`;
}

export function assetPathForMediaThumbnail(contentHash: string): string {
  return `${ASSETS_DIR}/media/${contentHash}-thumb.webp`;
}

function extensionForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mime.toLowerCase()] ?? 'png';
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,([\s\S]*)$/);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const payload = match[2];
  if (dataUrl.includes(';base64')) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { mime, bytes };
  }
  const encoded = encodeURIComponent(payload);
  const decoded = decodeURIComponent(encoded);
  const bytes = new TextEncoder().encode(decoded);
  return { mime, bytes };
}

async function blobFromInlineReference(url: string): Promise<Blob | null> {
  if (url.startsWith('data:')) {
    const parsed = parseDataUrl(url);
    if (!parsed) return null;
    return new Blob([Uint8Array.from(parsed.bytes)], { type: parsed.mime });
  }
  if (url.startsWith('blob:')) {
    try {
      const res = await fetch(url);
      return res.blob();
    } catch {
      return null;
    }
  }
  return null;
}

async function getAssetsDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<FileSystemDirectoryHandle> {
  return dir.getDirectoryHandle(ASSETS_DIR, { create: true });
}

function assetFileName(assetPath: string): string {
  return assetPath.slice(`${ASSETS_DIR}/`.length);
}

async function writeBlobToAssetPath(
  assetsDir: FileSystemDirectoryHandle,
  assetPath: string,
  blob: Blob,
): Promise<void> {
  const fileHandle = await assetsDir.getFileHandle(assetFileName(assetPath), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

async function readBlobFromAssetPath(
  assetsDir: FileSystemDirectoryHandle,
  assetPath: string,
): Promise<Blob | null> {
  try {
    const fileHandle = await assetsDir.getFileHandle(assetFileName(assetPath));
    const file = await fileHandle.getFile();
    return file;
  } catch {
    return null;
  }
}

async function externalizeReferenceList(
  assetsDir: FileSystemDirectoryHandle,
  owner: { id: number; referenceRoles: ReferenceRole[] },
  refs: (string | null)[],
  pathFor: (shotId: number, index: number, role: ReferenceRole, ext: string) => string,
): Promise<(string | null)[]> {
  return Promise.all(
    refs.map(async (ref, index) => {
      if (!ref || !shouldExternalizeReference(ref)) return ref;

      const blob = await blobFromInlineReference(ref);
      if (!blob) return ref;

      const role = normalizeReferenceRole(owner.referenceRoles[index] ?? 'None');
      const ext = extensionForMime(blob.type);
      const assetPath = pathFor(owner.id, index, role, ext);
      await writeBlobToAssetPath(assetsDir, assetPath, blob);
      registerAssetBlob(assetPath, blob);
      return assetPath;
    }),
  );
}

async function externalizeShotReferences(
  assetsDir: FileSystemDirectoryHandle,
  shot: Shot,
): Promise<Shot> {
  const references = await externalizeReferenceList(
    assetsDir,
    shot,
    shot.references,
    assetPathForReference,
  );
  const transformedReferences = shot.transformedReferences
    ? await externalizeReferenceList(
        assetsDir,
        shot,
        shot.transformedReferences,
        assetPathForTransformedReference,
      )
    : shot.transformedReferences;

  const backdropCropsByAspect = shot.backdropCropsByAspect
    ? await externalizeBackdropCrops(assetsDir, shot.id, shot.backdropCropsByAspect)
    : shot.backdropCropsByAspect;

  return externalizeShotBakedFrames(assetsDir, {
    ...shot,
    references,
    transformedReferences,
    backdropCropsByAspect,
  });
}

async function externalizeShotBakedFrames(
  assetsDir: FileSystemDirectoryHandle,
  shot: Shot,
): Promise<Shot> {
  let bakedStartFrame = shot.bakedStartFrame;
  let bakedIntermediateFrame = shot.bakedIntermediateFrame;

  if (bakedStartFrame && shouldExternalizeReference(bakedStartFrame)) {
    const blob = await blobFromInlineReference(bakedStartFrame);
    if (blob) {
      const id = await hashBlobContent(blob);
      const path = assetPathForMediaAsset(id, extensionForMime(blob.type));
      await writeBlobToAssetPath(assetsDir, path, blob);
      registerAssetBlob(path, blob);
      bakedStartFrame = path;
    }
  }

  if (
    bakedIntermediateFrame &&
    shouldExternalizeReference(bakedIntermediateFrame) &&
    bakedIntermediateFrame !== shot.bakedStartFrame
  ) {
    const blob = await blobFromInlineReference(bakedIntermediateFrame);
    if (blob) {
      const id = await hashBlobContent(blob);
      const path = assetPathForMediaAsset(id, extensionForMime(blob.type));
      await writeBlobToAssetPath(assetsDir, path, blob);
      registerAssetBlob(path, blob);
      bakedIntermediateFrame = path;
    }
  }

  return { ...shot, bakedStartFrame, bakedIntermediateFrame };
}

async function externalizeMediaAssetUrl(
  assetsDir: FileSystemDirectoryHandle,
  asset: MediaAsset,
  ref: string,
  thumbnail = false,
): Promise<string> {
  if (!shouldExternalizeReference(ref)) return ref;
  const blob = await blobFromInlineReference(ref);
  if (!blob) return ref;
  const path = thumbnail
    ? assetPathForMediaThumbnail(asset.id)
    : assetPathForMediaAsset(asset.id, extensionForMime(blob.type));
  await writeBlobToAssetPath(assetsDir, path, blob);
  registerAssetBlob(path, blob);
  return path;
}

async function externalizeMediaLibrary(
  assetsDir: FileSystemDirectoryHandle,
  library: MediaAsset[],
): Promise<MediaAsset[]> {
  return Promise.all(
    library.map(async (asset) => {
      const url = await externalizeMediaAssetUrl(assetsDir, asset, asset.url);
      const thumbnailUrl = asset.thumbnailUrl
        ? await externalizeMediaAssetUrl(assetsDir, asset, asset.thumbnailUrl, true)
        : undefined;
      return { ...asset, url, thumbnailUrl };
    }),
  );
}

async function externalizeBackdropCrops(
  assetsDir: FileSystemDirectoryHandle,
  ownerId: number,
  crops: Partial<Record<AspectRatio, string>> | undefined,
): Promise<Partial<Record<AspectRatio, string>> | undefined> {
  if (!crops) return crops;
  const entries = Object.entries(crops) as [AspectRatio, string][];
  const out: Partial<Record<AspectRatio, string>> = { ...crops };

  await Promise.all(
    entries.map(async ([aspect, ref]) => {
      if (!ref || !shouldExternalizeReference(ref)) return;
      const blob = await blobFromInlineReference(ref);
      if (!blob) return;
      const ext = extensionForMime(blob.type);
      const assetPath = assetPathForBackdropCrop(ownerId, aspect, ext);
      await writeBlobToAssetPath(assetsDir, assetPath, blob);
      registerAssetBlob(assetPath, blob);
      out[aspect] = assetPath;
    }),
  );

  return out;
}

async function externalizeCoverageShot(
  assetsDir: FileSystemDirectoryHandle,
  coverage: CoverageShot,
): Promise<CoverageShot> {
  let bakedStartFrame = coverage.bakedStartFrame;
  let bakedIntermediateFrame = coverage.bakedIntermediateFrame;

  if (bakedStartFrame && shouldExternalizeReference(bakedStartFrame)) {
    const blob = await blobFromInlineReference(bakedStartFrame);
    if (blob) {
      const id = await hashBlobContent(blob);
      const path = assetPathForMediaAsset(id, extensionForMime(blob.type));
      await writeBlobToAssetPath(assetsDir, path, blob);
      registerAssetBlob(path, blob);
      bakedStartFrame = path;
    }
  }

  if (
    bakedIntermediateFrame &&
    shouldExternalizeReference(bakedIntermediateFrame) &&
    bakedIntermediateFrame !== coverage.bakedStartFrame
  ) {
    const blob = await blobFromInlineReference(bakedIntermediateFrame);
    if (blob) {
      const id = await hashBlobContent(blob);
      const path = assetPathForMediaAsset(id, extensionForMime(blob.type));
      await writeBlobToAssetPath(assetsDir, path, blob);
      registerAssetBlob(path, blob);
      bakedIntermediateFrame = path;
    }
  }

  return { ...coverage, bakedStartFrame, bakedIntermediateFrame };
}

async function externalizeSetupReferences(
  assetsDir: FileSystemDirectoryHandle,
  setup: Setup,
): Promise<Setup> {
  const references = await externalizeReferenceList(
    assetsDir,
    setup,
    setup.references,
    assetPathForReference,
  );
  const transformedReferences = setup.transformedReferences
    ? await externalizeReferenceList(
        assetsDir,
        setup,
        setup.transformedReferences,
        assetPathForTransformedReference,
      )
    : setup.transformedReferences;

  const backdrops = await Promise.all(
    setup.backdrops.map(async (backdrop) => {
      let url = backdrop.url;
      if (url && shouldExternalizeReference(url)) {
        const blob = await blobFromInlineReference(url);
        if (blob) {
          const id = await hashBlobContent(blob);
          const path = assetPathForMediaAsset(id, extensionForMime(blob.type));
          await writeBlobToAssetPath(assetsDir, path, blob);
          registerAssetBlob(path, blob);
          url = path;
        }
      }
      const backdropCropsByAspect = await externalizeBackdropCrops(
        assetsDir,
        setup.id,
        backdrop.backdropCropsByAspect,
      );
      return { ...backdrop, url, backdropCropsByAspect };
    }),
  );

  const shots = await Promise.all(
    setup.shots.map((coverage) => externalizeCoverageShot(assetsDir, coverage)),
  );

  return {
    ...setup,
    references,
    transformedReferences,
    backdrops,
    shots,
  };
}

export async function externalizeProjectReferences(
  dir: FileSystemDirectoryHandle,
  project: StudioProject,
): Promise<StudioProject> {
  const assetsDir = await getAssetsDirectory(dir);
  const setups = await Promise.all(
    (project.setups ?? []).map((setup) => externalizeSetupReferences(assetsDir, setup)),
  );
  const mediaLibrary = project.mediaLibrary?.length
    ? await externalizeMediaLibrary(assetsDir, project.mediaLibrary)
    : project.mediaLibrary;
  return { ...project, setups, mediaLibrary };
}

async function hydrateReferenceList(
  assetsDir: FileSystemDirectoryHandle,
  refs: (string | null)[],
): Promise<(string | null)[]> {
  return Promise.all(
    refs.map(async (ref) => {
      if (!ref || !isProjectAssetPath(ref)) return ref;
      const cached = getAssetBlobUrl(ref);
      if (cached) return cached;

      const blob = await readBlobFromAssetPath(assetsDir, ref);
      if (!blob) return ref;
      return registerAssetBlob(ref, blob);
    }),
  );
}

async function hydrateOptionalAssetUrl(
  assetsDir: FileSystemDirectoryHandle,
  ref: string | null | undefined,
): Promise<string | null | undefined> {
  if (!ref || !isProjectAssetPath(ref)) return ref;
  const cached = getAssetBlobUrl(ref);
  if (cached) return cached;
  const blob = await readBlobFromAssetPath(assetsDir, ref);
  if (!blob) return ref;
  return registerAssetBlob(ref, blob);
}

async function hydrateCoverageShot(
  assetsDir: FileSystemDirectoryHandle,
  coverage: CoverageShot,
): Promise<CoverageShot> {
  const bakedStartFrame = await hydrateOptionalAssetUrl(assetsDir, coverage.bakedStartFrame);
  const bakedIntermediateFrame = await hydrateOptionalAssetUrl(
    assetsDir,
    coverage.bakedIntermediateFrame,
  );
  return {
    ...coverage,
    bakedStartFrame: bakedStartFrame ?? null,
    bakedIntermediateFrame: bakedIntermediateFrame ?? null,
  };
}

async function hydrateSetupReferences(
  assetsDir: FileSystemDirectoryHandle,
  setup: Setup,
): Promise<Setup> {
  const references = await hydrateReferenceList(assetsDir, setup.references);
  const transformedReferences = setup.transformedReferences
    ? await hydrateReferenceList(assetsDir, setup.transformedReferences)
    : setup.transformedReferences;

  const backdrops = await Promise.all(
    setup.backdrops.map(async (backdrop) => {
      const url = (await hydrateOptionalAssetUrl(assetsDir, backdrop.url)) ?? backdrop.url;
      const backdropCropsByAspect = backdrop.backdropCropsByAspect
        ? await hydrateBackdropCrops(assetsDir, backdrop.backdropCropsByAspect)
        : backdrop.backdropCropsByAspect;
      return { ...backdrop, url, backdropCropsByAspect };
    }),
  );

  const shots = await Promise.all(
    setup.shots.map((coverage) => hydrateCoverageShot(assetsDir, coverage)),
  );

  return {
    ...setup,
    references,
    transformedReferences,
    backdrops,
    shots,
  };
}

async function hydrateMediaLibrary(
  assetsDir: FileSystemDirectoryHandle,
  library: MediaAsset[],
): Promise<MediaAsset[]> {
  return Promise.all(
    library.map(async (asset) => {
      const url = (await hydrateOptionalAssetUrl(assetsDir, asset.url)) ?? asset.url;
      const thumbnailUrl = asset.thumbnailUrl
        ? (await hydrateOptionalAssetUrl(assetsDir, asset.thumbnailUrl)) ?? asset.thumbnailUrl
        : undefined;
      return { ...asset, url, thumbnailUrl };
    }),
  );
}

async function hydrateBackdropCrops(
  assetsDir: FileSystemDirectoryHandle,
  crops: Partial<Record<AspectRatio, string>>,
): Promise<Partial<Record<AspectRatio, string>>> {
  const out: Partial<Record<AspectRatio, string>> = { ...crops };
  await Promise.all(
    (Object.entries(crops) as [AspectRatio, string][]).map(async ([aspect, ref]) => {
      if (!ref || !isProjectAssetPath(ref)) return;
      const cached = getAssetBlobUrl(ref);
      if (cached) {
        out[aspect] = cached;
        return;
      }
      const blob = await readBlobFromAssetPath(assetsDir, ref);
      if (!blob) return;
      out[aspect] = registerAssetBlob(ref, blob);
    }),
  );
  return out;
}

export async function hydrateProjectReferences(
  dir: FileSystemDirectoryHandle,
  project: StudioProject,
): Promise<StudioProject> {
  const assetsDir = await getAssetsDirectory(dir);
  const setups = await Promise.all(
    (project.setups ?? []).map((setup) => hydrateSetupReferences(assetsDir, setup)),
  );
  const mediaLibrary = project.mediaLibrary?.length
    ? await hydrateMediaLibrary(assetsDir, project.mediaLibrary)
    : project.mediaLibrary;
  return { ...project, setups, mediaLibrary };
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}