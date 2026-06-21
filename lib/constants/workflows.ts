import {
  getAllWorkflowDefinitions,
  getDefaultWorkflowId,
  getWorkflowDefinition,
  isWorkflowImplemented,
  resolveWorkflowId,
} from '@/lib/constants/video-generation-workflows';
import type {
  BakeStatus,
  MannequinAge,
  MannequinAngle,
  MannequinGender,
  MannequinPose,
  Workflow,
} from '@/lib/types/studio';

export const DEFAULT_WORKFLOW: Workflow = getDefaultWorkflowId();

export const WORKFLOW_OPTIONS: ReadonlyArray<{
  value: Workflow;
  label: string;
  enabled: boolean;
}> = getAllWorkflowDefinitions().map((def) => ({
  value: def.id,
  label: def.label,
  enabled: isWorkflowImplemented(def.id),
}));

/** Default xAI image model for bake pass 1 (image edit). */
export const DEFAULT_XAI_BAKE_IMAGE_MODEL = 'grok-imagine-image-quality';

/** Default Replicate inpainting model when Replicate is selected for bake. */
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
  shot: { workflow?: Workflow | string } | undefined,
): Workflow {
  const raw = shot?.workflow;
  if (!raw) return DEFAULT_WORKFLOW;
  return resolveWorkflowId(raw) ?? DEFAULT_WORKFLOW;
}

export function isBakeStartFrameWorkflow(
  shot: { workflow?: Workflow | string } | undefined,
): boolean {
  return normalizeWorkflow(shot) === 'bake-start-frame';
}

/** @deprecated Use isBakeStartFrameWorkflow */
export function isLockStartFrameWorkflow(
  shot: { workflow?: Workflow | string } | undefined,
): boolean {
  return isBakeStartFrameWorkflow(shot);
}

export function getWorkflowLabel(workflow: Workflow | string | undefined): string {
  const def = getWorkflowDefinition(workflow);
  return def?.label ?? String(workflow ?? DEFAULT_WORKFLOW);
}

export function defaultBakeStatus(): BakeStatus {
  return 'idle';
}
