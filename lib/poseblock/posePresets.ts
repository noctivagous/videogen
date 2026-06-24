export type PoseBlockPresetEntry = {
  name: string;
  gender: string;
  poseType: string;
  /** 1-based index within a pose group (same base name); omitted when the group has one item. */
  variant?: number;
  pose: Record<string, [number, number, number, number]>;
};

export type PoseBlockPose = Record<string, [number, number, number, number]>;

/** Default PoseBlock base pose: 4th frame of Male Walking (malewalking-t1000). */
export const DEFAULT_POSEBLOCK_BASE_POSE_ID = 'malewalking-t1000';

export function formatPosePresetLabel(entry: Pick<PoseBlockPresetEntry, 'name' | 'gender' | 'poseType' | 'variant'>): string {
  const base = `${entry.name} · ${entry.gender} · ${entry.poseType}`;
  return entry.variant != null ? `${base} · ${entry.variant}` : base;
}

export async function fetchPoseBlockPresetEntries(): Promise<Record<string, PoseBlockPresetEntry>> {
  const res = await fetch('/api/poseblock/poses');
  if (!res.ok) throw new Error('Failed to load poses');
  return res.json() as Promise<Record<string, PoseBlockPresetEntry>>;
}

export function posePresetsFromEntries(
  entries: Record<string, PoseBlockPresetEntry>,
): Record<string, PoseBlockPose> {
  return Object.fromEntries(
    Object.entries(entries)
      .filter(([, entry]) => Object.keys(entry.pose ?? {}).length > 0)
      .map(([id, entry]) => [id, entry.pose]),
  );
}
