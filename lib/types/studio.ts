export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

export type FieldSize =
  | 'ecu' | 'cu' | 'mcu' | 'close-shot' | 'ms' | 'fs' | 'ls' | 'els' | 'vls'
  | 'ws' | 'mws' | 'bcu' | 'xls' | 'cowboy' | 'ch' | 'gv';

export type SubjectCount = '1s' | '2s' | '3s' | 'group' | 'crowd';

export type Coverage = 'clean' | 'dirty-single' | 'ots' | 'one-half' | 'pov';

export type LensType = 'wide' | 'standard' | 'telephoto' | 'macro' | 'fisheye' | 'anamorphic';

export type CameraAngle =
  | 'eye-level' | 'high-angle' | 'low-angle' | 'birds-eye' | 'worms-eye' | 'dutch';

export type CameraMovement =
  | 'static' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down'
  | 'dolly-in' | 'dolly-out' | 'truck-left' | 'truck-right' | 'orbit' | 'handheld' | 'drone';

export type DepthOfField = 'shallow' | 'medium' | 'deep';

export type CompositionGuide = 'none' | 'rule-of-thirds' | 'golden-ratio' | 'center' | 'fill-frame';

export type Placement =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type Headroom = 'tight' | 'normal' | 'generous';

export type ReferenceRole = 'Subject' | 'Backdrop' | 'Motion' | 'Depth' | 'Canny' | 'None';

export interface FrameComposition {
  guide: CompositionGuide;
  placement: Placement;
  headroom: Headroom;
  showOverlay: boolean;
}

export interface ProjectSettings {
  name: string;
  resolution: string;
  aspectRatio: AspectRatio;
  fps: number;
  duration: number;
}

export interface CameraSettings {
  fieldSize: FieldSize;
  subjectCount: SubjectCount;
  coverage: Coverage;
  lensType: LensType;
  focalLength: number;
  angle: CameraAngle;
  movement: CameraMovement;
  aperture: number;
  dof: DepthOfField;
}

export interface LightingSettings {
  keyLight: string;
  intensity: number;
  style: string;
  timeOfDay: string;
  colorTemp: number;
  atmosphere: string;
}

export interface MotionSettings {
  intensity: string;
  subjectAction: string;
  stabilization: number;
  motionBlur: string;
}

export interface Shot {
  id: number;
  name: string;
  duration: number;
  thumbnail: string | null;
  active: boolean;
  references: (string | null)[];
  referenceRoles: ReferenceRole[];
  frameComposition: FrameComposition;
}

export interface StudioProject {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  prompt: string;
  shots: Shot[];
  currentShot: number;
}

export interface ProviderConfig {
  apiKey: string;
  connected: boolean;
  lastTested?: number;
}

export interface CustomProvider {
  id: string;
  name: string;
  desc: string;
  baseUrl: string;
  apiKey: string;
  connected: boolean;
}

export interface AIState {
  configured: Record<string, ProviderConfig>;
  customProviders: CustomProvider[];
  defaultProvider: string;
}

export interface BuiltInProvider {
  id: string;
  name: string;
  desc: string;
  icon: string;
  hint: string;
}

export interface ScenePreviewPayload {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  shot: Shot | undefined;
}

export type ToastType = 'success' | 'error';

export type PreviewMode = 'vector' | '3d';