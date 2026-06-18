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

export type CompositionGuide = 'none' | 'grid-3x3' | 'center' | 'fill-frame';

/** 4×4 line intersections, edge/center mids, or 3×3 cell centers — see placement-grid.ts */
export type Placement = string;

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
  videoUrl: string | null;
  active: boolean;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  sceneSetup: string;
  shotActivity: string;
  /** @deprecated migrated to sceneSetup on load */
  prompt?: string;
  references: (string | null)[];
  referenceRoles: ReferenceRole[];
  frameComposition: FrameComposition;
  /** AI-generated quick preview still for this shot */
  previewFrameUrl?: string | null;
  /** Fingerprint of camera/aspect when previewFrameUrl was generated */
  previewFrameFingerprint?: string | null;
}

export interface StudioProject {
  schemaVersion?: number;
  project: ProjectSettings;
  shots: Shot[];
  currentShot: number;
  /** @deprecated v1 project-level settings — migrated into each shot on load */
  camera?: CameraSettings;
  lighting?: LightingSettings;
  motion?: MotionSettings;
  prompt?: string;
}

export type Modality = 'llm' | 'image' | 'video' | 'tts';

export type ProviderStatus = 'not_configured' | 'configured' | 'verified' | 'failed';

export interface ProviderModel {
  id: string;
  name: string;
  modalities: Modality[];
  purposes?: string[];
}

export interface ProviderDiscovery {
  lastTested?: number;
  lastTestOk?: boolean;
  lastTestMessage?: string;
  models?: ProviderModel[];
  modalities?: Modality[];
  purposes?: string[];
}

export interface ProviderConfig extends ProviderDiscovery {
  apiKey: string;
  connected: boolean;
}

export interface CustomProvider extends ProviderDiscovery {
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
  /** Video model id for the current default provider */
  defaultModelId?: string;
}

export interface BuiltInProvider {
  id: string;
  name: string;
  desc: string;
  icon: string;
  hint: string;
  purposes: string[];
  modalities: Modality[];
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

export type PreviewSubMode = 'framing' | 'model';