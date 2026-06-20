export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

export type FieldSize =
  | 'ecu' | 'cu' | 'mcu' | 'close-shot' | 'ms' | 'fs' | 'ls' | 'els' | 'vls'
  | 'ws' | 'mws' | 'bcu' | 'xls' | 'cowboy' | 'ch' | 'gv';

export type SubjectCount = '1s' | '2s' | '3s' | 'group' | 'crowd';

export type Coverage = 'clean' | 'dirty-single' | 'ots' | 'one-half' | 'pov';

export type LensType = 'wide' | 'standard' | 'telephoto' | 'macro' | 'fisheye' | 'anamorphic';

export type CameraAngle =
  | 'eye-level' | 'high-angle' | 'low-angle' | 'birds-eye' | 'worms-eye' | 'dutch' | 'drone';

export type CameraMovement =
  | 'static' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down'
  | 'dolly-in' | 'dolly-out' | 'truck-left' | 'truck-right' | 'orbit' | 'handheld' | 'drone'
  | 'push-in' | 'steadicam' | 'whip-pan' | 'zoom' | 'pov-track';

export type DepthOfField = 'very-shallow' | 'shallow' | 'medium' | 'deep';

export type CompositionGuide = 'none' | 'grid-3x3' | 'center' | 'fill-frame';

/** 4×4 line intersections, edge/center mids, or 3×3 cell centers — see placement-grid.ts */
export type Placement = string;

export type Headroom = 'tight' | 'normal' | 'generous';

export type ReferenceRole = 'Subject' | 'Backdrop' | 'Style' | 'Depth' | 'Canny' | 'None';

/** How shot image reference slots are labeled and described in prompts. */
export type ReferenceMode = 'auto-roles' | 'manual';

export type ThemeTransformSlotStatus = 'idle' | 'applying' | 'ready' | 'stale' | 'error';

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

export type ColorScheme =
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'tetradic'
  | 'monochromatic';

export type ColorPaletteMode =
  | 'color'
  | 'bw'
  | 'off'
  | 'false-color'
  | 'duotone'
  | 'accent-splash';

export type FxColorMode = 'false-color' | 'duotone' | 'accent-splash';

/** Cinematic monochrome looks — phrasing aligned with common AI video prompt guides. */
export type BwTonalLook = 'natural' | 'high-key' | 'low-key' | 'film-noir' | 'silhouette';

export type BwFilmGrain = 'none' | 'subtle' | 'heavy';

export interface BwTonalSettings {
  look: BwTonalLook;
  /** Overall contrast — maps to low / balanced / high contrast monochrome. */
  contrast: number;
  /** Shadow depth / black point — lifted grays through crushed blacks. */
  shadowDepth: number;
  /** Highlight roll-off — subdued through bright clean whites. */
  highlightTone: number;
  grain: BwFilmGrain;
}

export interface ColorPaletteSettings {
  mode: ColorPaletteMode;
  dominantHue: number;
  scheme: ColorScheme;
  saturation: number;
  brightness: number;
  keyLightWarmth: number;
  accentHue: number | null;
  /** Duotone secondary hue (primary = dominantHue). */
  secondaryHue: number;
  /** 0 = primary-heavy, 100 = secondary-heavy. */
  duotoneBalance: number;
  /** Accent isolation strength for accent-splash mode. */
  accentStrength: number;
  /** False-color spectrum shift / bias. */
  spectrumBias: number;
  /** Active Look Library recipe, or null when customized / none. */
  activeLookRecipeId: string | null;
  bw: BwTonalSettings;
}

/** Per-control opt-in for Theme Transformer image-reference prompts (default off). */
export interface ThemeTransformLightingInclusion {
  keyLight: boolean;
  style: boolean;
  timeOfDay: boolean;
  colorTemp: boolean;
  atmosphere: boolean;
}

/** Video-only atmospheric / environmental preset (not Theme Transformer). */
export interface VideoEnvironmentSettings {
  /** null = off / not applied */
  presetId: string | null;
}

export type VideoLightingTechniqueId =
  | 'chiaroscuro'
  | 'rembrandt'
  | 'split'
  | 'loop'
  | 'butterfly'
  | 'rim-backlight'
  | 'low-key'
  | 'high-key'
  | 'volumetric'
  | 'practical'
  | 'color-temperature'
  | 'three-point';

export type VideoLightingAngle =
  | 'left'
  | 'right'
  | 'above'
  | 'below'
  | 'front'
  | 'back';

export type VideoLightingKelvinBias = 'warm' | 'neutral' | 'cool';

export type VideoLightingPracticalSource = 'window' | 'desk-lamp' | 'overhead' | 'neon';

export type VideoLightingModifierKey =
  | 'intensity'
  | 'contrast'
  | 'softness'
  | 'brightness'
  | 'angle'
  | 'kelvinBias'
  | 'practicalSource'
  | 'keyIntensity'
  | 'fillIntensity'
  | 'backIntensity'
  | 'atmosphereDensity';

export interface VideoLightingModifierState {
  intensity?: number;
  contrast?: number;
  softness?: number;
  brightness?: number;
  angle?: VideoLightingAngle;
  kelvinBias?: VideoLightingKelvinBias;
  practicalSource?: VideoLightingPracticalSource;
  keyIntensity?: number;
  fillIntensity?: number;
  backIntensity?: number;
  atmosphereDensity?: number;
}

/** Video-only lighting technique presets (multi-select). */
export interface VideoLightingSettings {
  techniqueIds: VideoLightingTechniqueId[];
  modifiers: Partial<Record<VideoLightingTechniqueId, VideoLightingModifierState>>;
}

export interface LightingSettings {
  keyLight: string;
  intensity: number;
  style: string;
  timeOfDay: string;
  colorTemp: number;
  atmosphere: string;
  colorPalette: ColorPaletteSettings;
  /** Which lighting controls are woven into Theme Transformer prompts. */
  themeTransformLighting?: ThemeTransformLightingInclusion;
  /** Rich atmosphere phrases appended to video generation prompts only. */
  videoEnvironment?: VideoEnvironmentSettings;
  /** Cinematography lighting techniques appended to video generation prompts only. */
  videoLighting?: VideoLightingSettings;
}

export interface MotionSettings {
  intensity: string;
  subjectAction: string;
  stabilization: number;
  motionBlur: string;
}

export interface BackdropFraming {
  /** Multiplier on top of cover-fit baseline (1 = fill frame). */
  scale: number;
  /** Non-uniform stretch on width axis (1 = no extra stretch). */
  scaleX: number;
  /** Non-uniform stretch on height axis (1 = no extra stretch). */
  scaleY: number;
  /** Normalized pan in frame space, -1..1 from center. */
  offsetX: number;
  offsetY: number;
  rotation: number;
  skewX: number;
  skewY: number;
  /** CSS perspective distance in px (0 = none). */
  perspective: number;
  locked: boolean;
}

export type BackdropCropStatus = 'none' | 'pending' | 'ready' | 'error';

export interface GeneratedVideo {
  id: string;
  url: string;
  posterUrl?: string | null;
  createdAt: number;
  providerJobId?: string;
}

export interface Shot {
  id: number;
  name: string;
  duration: number;
  thumbnail: string | null;
  /** Active generated video URL — kept in sync with generatedVideos[activeVideoIndex] */
  videoUrl: string | null;
  generatedVideos?: GeneratedVideo[];
  activeVideoIndex?: number;
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
  /** Auto-roles: Subject/Backdrop/Style labels + role-aware prompt binding. Manual: Image1/Image2/Image3. */
  referenceMode?: ReferenceMode;
  /** @deprecated migrated to referenceMode on load */
  cinematographyRefs?: boolean;
  /** Per-slot images after Theme Transformer image-model edit. */
  transformedReferences?: (string | null)[];
  themeTransformFingerprint?: (string | null)[];
  themeTransformStatus?: ThemeTransformSlotStatus[];
  themeTransformError?: (string | null)[];
  /** Slots the user connected via Theme Transformer drag — stale when palette/refs change. */
  themeTransformLinked?: boolean[];
  frameComposition: FrameComposition;
  /** AI-generated quick preview still for this shot */
  previewFrameUrl?: string | null;
  /** Fingerprint of camera/aspect when previewFrameUrl was generated */
  previewFrameFingerprint?: string | null;
  /** Per-aspect pan/scale/lock for the backdrop reference slot. */
  backdropFramingByAspect?: Partial<Record<AspectRatio, BackdropFraming>>;
  /** Cropped backdrop per aspect ratio — sent to models instead of the raw upload. */
  backdropCropsByAspect?: Partial<Record<AspectRatio, string>>;
  /** Lock/crop pipeline status per aspect ratio. */
  backdropCropStatusByAspect?: Partial<Record<AspectRatio, BackdropCropStatus>>;
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
  /** Key is supplied by server env — client never stores or sends the secret. */
  serverManaged?: boolean;
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
  defaultVideoProvider: string;
  /** Video model id for the selected video provider */
  defaultVideoModelId?: string;
  defaultImageProvider: string;
  /** Image model id for quick preview / image generation */
  defaultImageModelId?: string;
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