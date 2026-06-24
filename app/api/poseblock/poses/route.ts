import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

type Pose = Record<string, [number, number, number, number]>;

interface PoseEntry {
  name: string;
  gender: 'Male' | 'Female' | 'Either';
  poseType: string;
  variant?: number;
  pose: Pose;
}

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

function filenameToId(filename: string): string {
  return filename.replace(/\.json$/i, '');
}

function normalizeId(id: string): string {
  return id
    .replace(/^posemodel-animation-/, '')
    .replace(/^posemodelanimation-/, '')
    .replace(/-t\d+$/i, '');
}

function timeSuffixFromId(id: string): number {
  const match = id.match(/-t(\d+)$/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function assignPoseVariants(result: Record<string, PoseEntry>): void {
  const groups = new Map<string, string[]>();

  for (const id of Object.keys(result)) {
    const groupKey = normalizeId(id);
    const ids = groups.get(groupKey);
    if (ids) ids.push(id);
    else groups.set(groupKey, [id]);
  }

  for (const ids of groups.values()) {
    if (ids.length <= 1) continue;
    ids.sort((a, b) => timeSuffixFromId(a) - timeSuffixFromId(b));
    ids.forEach((id, index) => {
      result[id].variant = index + 1;
    });
  }
}

function fallbackMetaFromId(id: string): Omit<PoseEntry, 'pose'> {
  const key = normalizeId(id);
  switch (key) {
    case 'female-start-walking':
      return { name: 'Female Start Walking', gender: 'Female', poseType: 'Walking' };
    case 'malesittingslouched':
      return { name: 'Male Sitting Slouched', gender: 'Male', poseType: 'Slouched' };
    case 'malewalking':
      return { name: 'Male Walking', gender: 'Male', poseType: 'Walking' };
    case 'reclinedsittingwithonelegontheother':
      return { name: 'Reclined Sitting With One Leg On The Other', gender: 'Either', poseType: 'Reclined' };
    case 'seatedongroundwhilereadingperiodical':
      return { name: 'Seated On Ground While Reading Periodical', gender: 'Either', poseType: 'Reading' };
    case 'sitting-crosslegged':
      return { name: 'Sitting Crosslegged', gender: 'Either', poseType: 'Cross-legged' };
    case 'scanningsurroundings':
      return { name: 'Scanning Surroundings', gender: 'Either', poseType: 'Scanning' };
    case 'posemodel-malerecliningrelaxedwitharmsbehindhead':
      return { name: 'Male Reclining Relaxed With Arms Behind Head', gender: 'Male', poseType: 'Reclining' };
    case 'posemodel-malesittingongroundwithhandscrossedarmsonknees':
      return { name: 'Male Sitting On Ground With Hands Crossed Arms On Knees', gender: 'Male', poseType: 'Ground Sit' };
    case 'posemodel-seated-attentivewaitingwidestance':
      return { name: 'Seated Attentive Waiting Wide Stance', gender: 'Either', poseType: 'Attentive Waiting' };
    case 'posemodel-seatedongroundwhilereadingperiodicalcrosslegged':
      return { name: 'Seated On Ground While Reading Periodical Crosslegged', gender: 'Either', poseType: 'Reading' };
    case 'salute-extracted':
      return { name: 'Salute', gender: 'Either', poseType: 'Salute' };
    case 'mixamo-reference-bind':
      return { name: 'Mixamo Reference Bind', gender: 'Either', poseType: 'Reference' };
    case 'y-bot-bind':
      return { name: 'Y Bot Bind', gender: 'Either', poseType: 'Reference' };
    case 'y-bot-frame10':
      return { name: 'Y Bot Frame 10', gender: 'Either', poseType: 'Reference' };
    default:
      return { name: key.replace(/-/g, ' '), gender: 'Either', poseType: 'Unknown' };
  }
}

function extractPose(parsed: unknown): Pose | null {
  if (isPose(parsed)) return parsed;

  if (!parsed || typeof parsed !== 'object') return null;

  const record = parsed as Record<string, unknown>;
  if ('pose' in record && isPose(record.pose)) return record.pose;
  if ('bind' in record && isPose(record.bind)) return record.bind;

  return null;
}

function metaFromParsed(id: string, parsed: unknown): Omit<PoseEntry, 'pose'> {
  const fallback = fallbackMetaFromId(id);
  if (
    parsed
    && typeof parsed === 'object'
    && typeof (parsed as { name?: unknown }).name === 'string'
    && typeof (parsed as { gender?: unknown }).gender === 'string'
    && typeof (parsed as { poseType?: unknown }).poseType === 'string'
  ) {
    return {
      name: (parsed as { name: string }).name,
      gender: (parsed as { gender: PoseEntry['gender'] }).gender,
      poseType: (parsed as { poseType: string }).poseType,
    };
  }
  return fallback;
}

async function loadPoseEntry(file: string, posesDir: string): Promise<[string, PoseEntry] | null> {
  try {
    const fullPath = path.join(posesDir, file);
    const raw = await readFile(fullPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    const id = filenameToId(file);
    const pose = extractPose(parsed);
    if (!pose) return null;

    return [id, { ...metaFromParsed(id, parsed), pose }];
  } catch {
    return null;
  }
}

export async function GET() {
  const posesDir = path.join(process.cwd(), 'PoseBlock', 'poses');

  let files: string[] = [];
  try {
    files = await readdir(posesDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return Response.json({});
    throw error;
  }

  const result: Record<string, PoseEntry> = {};

  for (const file of files.filter((f) => f.toLowerCase().endsWith('.json')).sort()) {
    const entry = await loadPoseEntry(file, posesDir);
    if (entry) {
      const [id, data] = entry;
      result[id] = data;
    }
  }

  assignPoseVariants(result);

  return Response.json(result);
}
