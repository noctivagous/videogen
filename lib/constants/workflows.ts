import type {
  BakeStatus,
  MannequinAge,
  MannequinAngle,
  MannequinGender,
  MannequinPose,
  Workflow,
} from '@/lib/types/studio';

export const DEFAULT_WORKFLOW: Workflow = 'auto-place';

export const WORKFLOW_OPTIONS: ReadonlyArray<{
  value: Workflow;
  label: string;
  enabled: boolean;
}> = [
  { value: 'auto-place', label: 'Auto-place Character', enabled: true },
  { value: 'lock-start-frame', label: 'Lock Start Frame', enabled: true },
  { value: 'broll', label: 'B-roll', enabled: false },
  { value: 'motion-transfer', label: 'Motion Transfer', enabled: false },
];

/** Default Replicate inpainting model for bake pass 1. */
export const DEFAULT_INPAINT_MODEL = 'black-forest-labs/flux-fill-pro';

export const MANNEQUIN_ANGLE_OPTIONS: ReadonlyArray<{
  value: MannequinAngle;
  label: string;
}> = [
  { value: 'front', label: 'Front' },
  { value: 'threeQuarterLeft', label: '3/4 Left' },
  { value: 'threeQuarterRight', label: '3/4 Right' },
  { value: 'left', label: 'Left Profile' },
  { value: 'rearThreeQuarterLeft', label: 'Rear 3/4 Left' },
  { value: 'back', label: 'Back' },
  { value: 'rearThreeQuarterRight', label: 'Rear 3/4 Right' },
  { value: 'right', label: 'Right Profile' },
];

export const MANNEQUIN_GENDER_OPTIONS: ReadonlyArray<{ value: MannequinGender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const MANNEQUIN_AGE_OPTIONS: ReadonlyArray<{ value: MannequinAge; label: string }> = [
  { value: 'adult', label: 'Adult' },
  { value: 'teen', label: 'Teen' },
  { value: 'child', label: 'Child' },
];

export const MANNEQUIN_POSE_OPTIONS: ReadonlyArray<{
  value: MannequinPose;
  label: string;
  enabled: boolean;
}> = [
  { value: 'standard', label: 'Standing', enabled: true },
  { value: 'walking', label: 'Walking (soon)', enabled: false },
  { value: 'seated', label: 'Seated (soon)', enabled: false },
];

export function normalizeWorkflow(
  shot: { workflow?: Workflow } | undefined,
): Workflow {
  return shot?.workflow ?? DEFAULT_WORKFLOW;
}

export function isLockStartFrameWorkflow(
  shot: { workflow?: Workflow } | undefined,
): boolean {
  return normalizeWorkflow(shot) === 'lock-start-frame';
}

export function defaultBakeStatus(): BakeStatus {
  return 'idle';
}