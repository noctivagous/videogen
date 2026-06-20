import { readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { validateStudioProject } from '@/lib/storage/project-io';
import {
  filterProjectMediaUploads,
  setValueAtPath,
  type ProjectMediaUpload,
} from '@/lib/storage/project-media-paths';
import type { StudioProject } from '@/lib/types/studio';

const DATA_ROOT = path.join(process.cwd(), '.data', 'server-projects');
const PROJECT_FILE = 'project.json';
const MEDIA_DIR = 'media';

const MAX_INLINE_BYTES = 25 * 1024 * 1024;
const MAX_REMOTE_BYTES = 200 * 1024 * 1024;
const DEFAULT_DEV_SESSION = 'videogen-local-dev';

export function isServerProjectStorageAllowed(): boolean {
  return (
    process.env.ALLOW_SERVER_PROJECT_STORAGE !== 'false' &&
    process.env.NEXT_PUBLIC_ALLOW_SERVER_PROJECT_STORAGE !== 'false'
  );
}

export function isServerProjectStorageDevMode(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.SERVER_PROJECT_STORAGE_DEV_MODE === 'true' &&
    process.env.NEXT_PUBLIC_SERVER_PROJECT_STORAGE_DEV_MODE === 'true' &&
    isServerProjectStorageAllowed()
  );
}

export function serverProjectStorageDevSessionId(): string {
  return (
    process.env.SERVER_PROJECT_STORAGE_DEV_SESSION?.trim() ||
    process.env.NEXT_PUBLIC_SERVER_PROJECT_STORAGE_DEV_SESSION?.trim() ||
    DEFAULT_DEV_SESSION
  );
}

/** Dev: skip downloading remote provider URLs unless explicitly enabled. */
export function shouldIngestRemoteMediaUrls(): boolean {
  if (!isServerProjectStorageDevMode()) return true;
  return (
    process.env.SERVER_PROJECT_STORAGE_DEV_DOWNLOAD_MEDIA_URLS === 'true' &&
    process.env.NEXT_PUBLIC_SERVER_PROJECT_STORAGE_DEV_DOWNLOAD_MEDIA_URLS === 'true'
  );
}

/** Reject shared dev session id when dev mode is not active (e.g. production). */
export function isServerProjectSessionAllowed(sessionId: string): boolean {
  if (!isServerProjectStorageAllowed()) return false;
  const devSession = serverProjectStorageDevSessionId();
  if (sessionId === devSession && !isServerProjectStorageDevMode()) {
    return false;
  }
  return true;
}

function sessionDir(sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safe) throw new Error('Invalid session id');
  return path.join(DATA_ROOT, safe);
}

function mediaPublicUrl(sessionId: string, filename: string): string {
  return `/api/project-storage/media/${sessionId}/${filename}`;
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Buffer } | null {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,([\s\S]*)$/);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const payload = match[2];
  if (dataUrl.includes(';base64')) {
    return { mime, bytes: Buffer.from(payload, 'base64') };
  }
  return { mime, bytes: Buffer.from(decodeURIComponent(payload)) };
}

function parseContentType(header: string | null): string | null {
  if (!header) return null;
  const mime = header.split(';')[0]?.trim().toLowerCase();
  return mime || null;
}

function extensionForMime(mime: string, fallback = 'bin'): string {
  const normalized = mime.toLowerCase();
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  if (map[normalized]) return map[normalized];
  if (normalized.startsWith('image/')) return 'png';
  if (normalized.startsWith('video/')) return 'mp4';
  return fallback;
}

function sniffMimeFromBytes(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (bytes.length >= 6) {
    const header = bytes.subarray(0, 6).toString('ascii');
    if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'video/mp4';
  }
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return 'video/webm';
  }
  return null;
}

/** Last-resort MIME when headers and magic bytes are inconclusive. */
function mimeHintFromUploadPath(uploadPath: string): string | null {
  if (/\.videoUrl$|generatedVideos\.\d+\.url$/.test(uploadPath)) return 'video/mp4';
  if (
    /transformedReferences|\.references\.|previewFrameUrl|thumbnail|posterUrl/.test(uploadPath)
  ) {
    return 'image/png';
  }
  return null;
}

function resolveUploadMime(upload: ProjectMediaUpload, bytes: Buffer, contentType: string | null): string {
  if (upload.kind === 'inline') {
    return parseDataUrl(upload.dataUrl)?.mime ?? 'application/octet-stream';
  }

  const headerMime = parseContentType(contentType);
  if (headerMime && headerMime !== 'application/octet-stream') {
    return headerMime;
  }

  return sniffMimeFromBytes(bytes) ?? mimeHintFromUploadPath(upload.path) ?? headerMime ?? 'application/octet-stream';
}

function filenameForUpload(upload: ProjectMediaUpload, bytes: Buffer, mime: string): string {
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const slug = upload.path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  const ext = extensionForMime(mime, mime.startsWith('video/') ? 'mp4' : 'png');
  return `${slug || 'asset'}-${hash}.${ext}`;
}

async function ensureSessionDirs(sessionId: string): Promise<{ root: string; media: string }> {
  const root = sessionDir(sessionId);
  const media = path.join(root, MEDIA_DIR);
  await fs.mkdir(media, { recursive: true });
  return { root, media };
}

async function payloadForUpload(
  upload: ProjectMediaUpload,
): Promise<{ bytes: Buffer; mime: string }> {
  if (upload.kind === 'inline') {
    const parsed = parseDataUrl(upload.dataUrl);
    if (!parsed) throw new Error(`Invalid inline asset at ${upload.path}`);
    if (parsed.bytes.length > MAX_INLINE_BYTES) {
      throw new Error(`Inline asset too large at ${upload.path}`);
    }
    return { bytes: parsed.bytes, mime: parsed.mime };
  }

  const res = await fetch(upload.url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Failed to fetch ${upload.url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_REMOTE_BYTES) {
    throw new Error(`Remote asset too large at ${upload.path}`);
  }
  const mime = resolveUploadMime(upload, buf, res.headers.get('content-type'));
  return { bytes: buf, mime };
}

export async function saveServerProject(
  sessionId: string,
  project: StudioProject,
  uploads: ProjectMediaUpload[],
): Promise<StudioProject> {
  const { root, media } = await ensureSessionDirs(sessionId);
  let nextProject = structuredClone(project);
  const ingestUploads = filterProjectMediaUploads(uploads, {
    ingestRemoteUrls: shouldIngestRemoteMediaUrls(),
  });

  for (const upload of ingestUploads) {
    const { bytes, mime } = await payloadForUpload(upload);
    const filename = filenameForUpload(upload, bytes, mime);
    const filePath = path.join(media, filename);
    await fs.writeFile(filePath, bytes);
    nextProject = setValueAtPath(
      nextProject,
      upload.path,
      mediaPublicUrl(sessionId, filename),
    );
  }

  const validated = validateStudioProject(nextProject);
  if (!validated) throw new Error('Invalid project payload');

  await fs.writeFile(
    path.join(root, PROJECT_FILE),
    `${JSON.stringify(validated, null, 2)}\n`,
    'utf8',
  );

  return validated;
}

export async function loadServerProject(sessionId: string): Promise<StudioProject | null> {
  try {
    const raw = await fs.readFile(path.join(sessionDir(sessionId), PROJECT_FILE), 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return validateStudioProject(parsed);
  } catch {
    return null;
  }
}

export async function deleteServerProject(sessionId: string): Promise<void> {
  try {
    await fs.rm(sessionDir(sessionId), { recursive: true, force: true });
  } catch {
    // ignore missing session
  }
}

function mimeForFilename(filename: string): string {
  const ext = path.extname(filename).slice(1).toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'application/octet-stream';
}

function safeMediaFilename(filename: string): string | null {
  const safeName = path.basename(filename);
  if (safeName !== filename || safeName.includes('..')) return null;
  return safeName;
}

export async function readServerMediaFile(
  sessionId: string,
  filename: string,
): Promise<{ bytes: Buffer; mime: string } | null> {
  const safeName = safeMediaFilename(filename);
  if (!safeName) return null;

  try {
    const bytes = await fs.readFile(path.join(sessionDir(sessionId), MEDIA_DIR, safeName));
    return { bytes, mime: mimeForFilename(safeName) };
  } catch {
    return null;
  }
}

export function readServerMediaFileSync(
  sessionId: string,
  filename: string,
): { bytes: Buffer; mime: string } | null {
  const safeName = safeMediaFilename(filename);
  if (!safeName) return null;

  try {
    const bytes = readFileSync(path.join(sessionDir(sessionId), MEDIA_DIR, safeName));
    return { bytes, mime: mimeForFilename(safeName) };
  } catch {
    return null;
  }
}