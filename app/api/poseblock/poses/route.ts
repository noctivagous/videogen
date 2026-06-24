import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

type Pose = Record<string, [number, number, number, number]>;

function isQuaternionTuple(value: unknown): value is [number, number, number, number] {
  return (
    Array.isArray(value)
    && value.length === 4
    && value.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

function isPose(value: unknown): value is Pose {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).every(isQuaternionTuple);
}

function presetNameFromFilename(filename: string): string {
  return filename.replace(/\.json$/i, '');
}

async function loadFilePresets(posesDir: string): Promise<Record<string, Pose>> {
  const presets: Record<string, Pose> = {};

  let files: string[] = [];
  try {
    files = await readdir(posesDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return presets;
    throw error;
  }

  for (const file of files.filter((f) => f.toLowerCase().endsWith('.json')).sort()) {
    try {
      const fullPath = path.join(posesDir, file);
      const raw = await readFile(fullPath, 'utf8');
      const parsed: unknown = JSON.parse(raw);

      if (isPose(parsed)) {
        presets[presetNameFromFilename(file)] = parsed;
        continue;
      }

      if (
        parsed
        && typeof parsed === 'object'
        && 'pose' in parsed
        && isPose((parsed as { pose: unknown }).pose)
      ) {
        presets[presetNameFromFilename(file)] = (parsed as { pose: Pose }).pose;
      }
    } catch {
      // Skip malformed files so one bad preset does not block all presets.
    }
  }

  return presets;
}

export async function GET() {
  const posesDir = path.join(process.cwd(), 'PoseBlock', 'poses');
  const presets = await loadFilePresets(posesDir);
  return Response.json(presets);
}
