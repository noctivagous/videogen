import { readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { validateStudioProject } from '@/lib/storage/project-io';
import {
  setValueAtPath,
  type ProjectMediaUpload,
} from '@/lib/storage/project-media-paths';
import type { StudioProject } from '@/lib/types/studio';

const DATA_ROOT = path.join(process.cwd(), '.data', 'server-projects');
const PROJECT_FILE = 'project.json';
const MEDIA_DIR = 'media';

const MAX_INLINE_BYTES = 25 * 1024 * 1024;
const MAX_REMOTE_BYTES = 200 * 1024 * 1024;

export function isServerProjectStorageAllowed(): boolean {
  return (
    process.env.ALLOW_SERVER_PROJECT_STORAGE !== 'false' &&
    process.env.NEXT_PUBLIC_ALLOW_SERVER_PROJECT_STORAGE !== 'false'
  );
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

function extensionForMime(mime: string, fallback = 'bin'): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return map[mime.toLowerCase()] ?? fallback;
}

function filenameForUpload(upload: ProjectMediaUpload, bytes: Buffer): string {
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const slug = upload.path.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  const ext = upload.kind === 'inline'
    ? extensionForMime(parseDataUrl(upload.dataUrl)?.mime ?? 'application/octet-stream')
    : extensionForMime('application/octet-stream', 'mp4');
  return `${slug || 'asset'}-${hash}.${ext}`;
}

async function ensureSessionDirs(sessionId: string): Promise<{ root: string; media: string }> {
  const root = sessionDir(sessionId);
  const media = path.join(root, MEDIA_DIR);
  await fs.mkdir(media, { recursive: true });
  return { root, media };
}

async function bytesForUpload(upload: ProjectMediaUpload): Promise<Buffer> {
  if (upload.kind === 'inline') {
    const parsed = parseDataUrl(upload.dataUrl);
    if (!parsed) throw new Error(`Invalid inline asset at ${upload.path}`);
    if (parsed.bytes.length > MAX_INLINE_BYTES) {
      throw new Error(`Inline asset too large at ${upload.path}`);
    }
    return parsed.bytes;
  }

  const res = await fetch(upload.url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Failed to fetch ${upload.url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_REMOTE_BYTES) {
    throw new Error(`Remote asset too large at ${upload.path}`);
  }
  return buf;
}

export async function saveServerProject(
  sessionId: string,
  project: StudioProject,
  uploads: ProjectMediaUpload[],
): Promise<StudioProject> {
  const { root, media } = await ensureSessionDirs(sessionId);
  let nextProject = structuredClone(project);

  for (const upload of uploads) {
    const bytes = await bytesForUpload(upload);
    const filename = filenameForUpload(upload, bytes);
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