import type { MediaAsset } from '@/lib/types/media-library';

export const GLOBAL_MEDIA_JSON_NAME = 'global-media.json';

export interface GlobalMediaLibraryFile {
  schemaVersion: 1;
  assets: MediaAsset[];
}

export function serializeGlobalMediaLibrary(assets: MediaAsset[]): string {
  const payload: GlobalMediaLibraryFile = { schemaVersion: 1, assets };
  return JSON.stringify(payload, null, 2);
}

export function parseGlobalMediaLibrary(raw: unknown): MediaAsset[] {
  if (!raw || typeof raw !== 'object') return [];
  const file = raw as GlobalMediaLibraryFile;
  if (!Array.isArray(file.assets)) return [];
  return file.assets;
}

export async function readGlobalMediaFromDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<MediaAsset[]> {
  try {
    const fileHandle = await dir.getFileHandle(GLOBAL_MEDIA_JSON_NAME);
    const file = await fileHandle.getFile();
    const parsed = JSON.parse(await file.text()) as unknown;
    return parseGlobalMediaLibrary(parsed);
  } catch {
    return [];
  }
}

export async function writeGlobalMediaToDirectory(
  dir: FileSystemDirectoryHandle,
  assets: MediaAsset[],
): Promise<void> {
  const fileHandle = await dir.getFileHandle(GLOBAL_MEDIA_JSON_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(serializeGlobalMediaLibrary(assets));
  await writable.close();
}
