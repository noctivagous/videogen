import type { MediaAsset, ShotLinkedAssetKey, ShotWorkflowSnapshot } from '@/lib/types/media-library';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9';

export type FieldSize =
  | 'ecu' | 'cu' | 'mcu' | 'close-shot' | 'ms' | 'fs' | 'ls' | 'els' | 'vls'
  | 'ws' | 'mws' | 'bcu' | 'xls' | 'cowboy' | 'ch' | 'gv';

export type SubjectCount = '1s' | '2s' | '3s' | 'group' | 'crowd';

export type Coverage = 'clean' | 'dirty-single' | 'ots' | 'one-half' | 'pov';

/** Multi-subject blocking layout — replaces Coverage for 2S/3S/Group. */
export type TwoShotArrangement =
  | 'two-shot-clean'
  | 'two-shot-dirty'
  | 'ots-left'
  | 'ots-right'
  | 'profile'
  | 'staggered';

export type ThreeShotArrangement =
  | 'three-shot-clean'
  | 'three-shot-staggered'
  | 'three-shot-ots'
  | 'three-shot-triangle';

export type GroupArrangement = 'lineup' | 'conversation-circle' | 'walk-and-talk';

export type SubjectArrangement = TwoShotArrangement | ThreeShotArrangement | GroupArrangement;

export type CrowdDensity = 'sparse' | 'medium' | 'packed';

export type LensType = 'wide' | 'standard' | 'telephoto' | 'macro' | 'fisheye' | 'anamorphic';

export type CameraAngle =
  | 'eye-level' | 'high-angle' | 'low-angle' | 'birds-eye' | 'worms-eye' | 'dutch' | 'drone';

export type CameraMovement =
  | 'static' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down'
  | 'dolly-in' | 'dolly-out' | 'truck-left' | 'truck-right' | 'orbit' | 'handheld' | 'drone'
  | 'push-in' | 'steadicam' | 'whip-pan' | 'zoom' | 'pov-track';

export type DepthOfField = 'very-shallow' | 'shallow' | 'medium' | 'deep';

export type CompositionGuide = 'none' | 'grid-3x3' | 'golden-section' | 'center' | 'fill-frame';

/** 4×4 line intersections, edge/center mids, or 3×3 cell centers — see placement-grid.ts */
export type Placement = string;

export type Headroom = 'tight' | 'normal' | 'generous';

export type ReferenceRole = 'Subject' | 'Backdrop' | 'Style' | 'Depth' | 'Canny' | 'None';

/** How shot image reference slots are labeled and described in prompts. */
export type ReferenceMode = 'auto-roles' | 'manual';

export type Workflow =
  | 'auto-place'
  | 'bake-start-frame'
  | 'pure-broll'
  | 'start-end'
  | 'motion-transfer'
  | 'multi-shot'
  | 'camera-control'
  | 'video-inpaint'
  | 'restyle-lipsync';

export type MannequinAngle =
  | 'front'
  | 'threeQuarterLeft'
  | 'threeQuarterRight'
  | 'left'
  | 'rearThreeQuarterLeft'
  | 'back'
  | 'rearThreeQuarterRight'
  | 'right';

export type MannequinGender = 'male' | 'female';

export type MannequinAge = 'adult' | 'teen' | 'child';

export type MannequinPose = 'standard' | 'walking' | 'seated';

export type BakeStatus = 'idle' | 'baking' | 'ready' | 'error';

/** Workflow-specific generation state persisted per shot. */
export interface ShotWorkflowState {
  bakedStartFrame?: string | null;
  bakedIntermediateFrame?: string | null;
  bakeStatus?: BakeStatus;
  savedBakedFrameAssetIds?: string[];
  linkedAssetIds?: Partial<Record<ShotLinkedAssetKey, string>>;
  mannequins?: Mannequin[];
  workflowSnapshotId?: string | null;
}

export interface Mannequin {
  id: string;
  angle: MannequinAngle;
  gender: MannequinGender;
  age: MannequinAge;
  pose: MannequinPose;
  /** Optional PoseBlock base pose id used by 3D compositor. */
  poseBlockBasePoseId?: string;
  /** Optional PoseBlock incremental bone ops used by 3D compositor. */
  poseBlockPoseAdjustments?: Array<{
    type: string;
    [key: string]: unknown;
  }>;
  /** Normalized feet-anchor X (0 = left, 1 = right). */
  x: number;
  /** Normalized feet-anchor Y (0 = top, 1 = frame bottom, >1 = below frame for CU/MCU). */
  y: number;
  /** Display scale multiplier (0.1–10). */
  scale: number;
  /** Optional finer facing in 1/16 turns (0..15), layered over `angle` 1/8 sprites. */
  yawTurn16?: number;
  /** Camera-relative vertical observation angle in degrees (bird's-eye / worm's-eye). */
  pitchDeg?: number;
  /** PoseBlock roll/tilt around camera forward axis in degrees. */
  rollDeg?: number;
  rotation: number;
  /** @deprecated Use age — kept for persisted project migration. */
  ageScale?: number;
  /** For dirty-single foreground shoulder (default 1). */
  opacity?: number;
  /** Reference slot index for Pass 2 identity. Omit = unassigned (generic). */
  subjectSlotIndex?: number;
}

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
  /** Per-project UI preferences (persisted in project.json). */
  ui?: ProjectUiSettings;
}

export interface ProjectUiSettings {
  /** Workflow description fieldset in camera panel — default expanded. */
  workflowDescriptionExpanded?: boolean;
}

/** Per-section opt-in for camera settings in generation prompts (default on). */
export interface CameraPromptInclusion {
  /** Master toggle — when false, all camera sections are excluded from prompts. */
  includeInPrompt: boolean;
  /** Field size, subject count, and coverage. */
  shotSetup: boolean;
}

export interface CameraSettings {
  fieldSize: FieldSize;
  subjectCount: SubjectCount;
  coverage: Coverage;
  /** Blocking layout for 2S/3S/Group — ignored for 1S (uses coverage) and crowd. */
  arrangement: SubjectArrangement;
  /** Crowd shot density — only applies when subjectCount is crowd. */
  crowdDensity: CrowdDensity;
  /** Group extras beyond 4 identity sheets use generic figures in bake. */
  fillRestWithGenerics: boolean;
  /** Crowd: optional recognizable heroes baked from character sheets. */
  heroSubjectsEnabled: boolean;
  lensType: LensType;
  focalLength: number;
  angle: CameraAngle;
  movement: CameraMovement;
  aperture: number;
  dof: DepthOfField;
  promptInclusion: CameraPromptInclusion;
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

/**
 * Reusable image classification for project-owned image records.
 * Used to prevent unrelated image types from leaking into workflow pickers.
 */
export type ProjectImageDataType =
  | 'character-sheet'
  | 'backdrop-plate'
  | 'set-prop'
  | 'character-prop';

export interface ProjectImageRecord {
  id: string;
  url: string | null;
  label?: string;
  dataType: ProjectImageDataType;
  createdAt: number;
}

/** Placeholder data structure for reusable scene lighting recipes. */
export interface LightingPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

/** One harmony row saved from Color Palette Maker. */
export interface ColorPaletteGroupEntry {
  id: string;
  label?: string;
  palette: ColorPaletteSettings;
}

/** Named collection of palette groups — reusable in Media Library, Characters, Locations. */
export interface ColorPaletteCollection {
  id: string;
  name: string;
  groups: ColorPaletteGroupEntry[];
  createdAt: number;
  /** @deprecated legacy placeholder */
  swatches?: string[];
}

export interface GeneratedVideo {
  id: string;
  url: string;
  posterUrl?: string | null;
  createdAt: number;
  providerJobId?: string;
  /** Media library asset id once the video is archived for this shot. */
  mediaLibraryAssetId?: string;
}

/** Script-level container — hidden in UI until multi-scene support. */
export interface Scene {
  id: number;
  name: string;
}

// ── Character & Location first-class types ────────────────────────────────

export interface CharacterSheet {
  id: string;
  url: string;
  label?: string;
  dataType: 'character-sheet';
  createdAt: number;
}

/** Placeholder image type for character-owned props/accessories. */
export interface CharacterPropImage extends ProjectImageRecord {
  dataType: 'character-prop';
}

/** Named character entity that owns one or more reference sheets. */
export interface Character {
  id: string;
  name: string;
  /** At least one sheet required before a Character can be assigned. */
  sheets: CharacterSheet[];
  /** Placeholder: optional character-owned prop references. */
  props?: CharacterPropImage[];
  /** Character-owned prop names used by Character Manager inspector. */
  propNames?: string[];
  /** Character-owned wardrobe item names. */
  wardrobeItems?: string[];
  /** Character-owned pose names for quick recall. */
  storedPoses?: string[];
  /** Placeholder: optional reusable look controls attached to Character. */
  lightingPresets?: LightingPreset[];
  colorPalettes?: ColorPaletteCollection[];
  createdAt: number;
}

export interface LocationBackdropPlate {
  id: string;
  url: string | null;
  label: string;
  dataType: 'backdrop-plate';
  /** Source context for plate ownership/behavior in pickers. */
  source?: 'location' | 'manual';
  /** Setup IDs associated with a manual plate (for filtering/organization). */
  setupIds?: number[];
  backdropFramingByAspect?: Partial<Record<AspectRatio, BackdropFraming>>;
  backdropCropsByAspect?: Partial<Record<AspectRatio, string>>;
  backdropCropStatusByAspect?: Partial<Record<AspectRatio, BackdropCropStatus>>;
  createdAt: number;
}

/** Placeholder image type for location-owned set props. */
export interface SetPropImage extends ProjectImageRecord {
  dataType: 'set-prop';
}

/** Named location entity that owns one or more backdrop plates. */
export interface Location {
  id: string;
  name: string;
  /** At least one plate required before a Location can be assigned. */
  plates: LocationBackdropPlate[];
  /** Placeholder: optional set-prop references for this location. */
  setProps?: SetPropImage[];
  /** Placeholder: optional reusable look controls attached to Location. */
  lightingPresets?: LightingPreset[];
  colorPalettes?: ColorPaletteCollection[];
  createdAt: number;
}

// ── SetupBackdrop (per-setup storage — kept for backward compat) ───────────

/** Backdrop plate within a setup (LS, MS, CU from same location). */
export interface SetupBackdrop {
  id: string;
  label: string;
  url: string | null;
  backdropFramingByAspect?: Partial<Record<AspectRatio, BackdropFraming>>;
  backdropCropsByAspect?: Partial<Record<AspectRatio, string>>;
  backdropCropStatusByAspect?: Partial<Record<AspectRatio, BackdropCropStatus>>;
  linkedAssetId?: string;
}

/** Coverage / framing within a setup — user-facing "Shot". */
export interface CoverageShot {
  id: number;
  name: string;
  backdropId: string;
  duration: number;
  thumbnail: string | null;
  videoUrl: string | null;
  generatedVideos?: GeneratedVideo[];
  activeVideoIndex?: number;
  active?: boolean;
  camera: CameraSettings;
  motion: MotionSettings;
  shotActivity: string;
  promptAdditions?: string;
  lightingAtmospherePrompt?: string;
  bakeStartFramePrompt?: string;
  frameComposition: FrameComposition;
  previewFrameUrl?: string | null;
  previewFrameFingerprint?: string | null;
  workflow?: Workflow;
  workflowStates?: Partial<Record<Workflow, ShotWorkflowState>>;
  mannequins?: Mannequin[];
  bakedStartFrame?: string | null;
  bakedIntermediateFrame?: string | null;
  bakeStatus?: BakeStatus;
  savedBakedFrameAssetIds?: string[];
  linkedAssetIds?: Partial<Record<ShotLinkedAssetKey, string>>;
  workflowSnapshotId?: string | null;
}

/** Shared location/time/character context — timeline card. */
export interface Setup {
  id: number;
  sceneId: number;
  name: string;
  active?: boolean;
  sceneSetup: string;
  lighting: LightingSettings;
  crowdTypePrompt?: string;
  references: (string | null)[];
  referenceRoles: ReferenceRole[];
  referenceMode?: ReferenceMode;
  transformedReferences?: (string | null)[];
  themeTransformFingerprint?: (string | null)[];
  themeTransformStatus?: ThemeTransformSlotStatus[];
  themeTransformError?: (string | null)[];
  themeTransformLinked?: boolean[];
  backdrops: SetupBackdrop[];
  shots: CoverageShot[];
  /** Character IDs assigned to each subject slot (index matches subject checklist order). */
  characterSlots?: (string | null)[];
  /** Character sheet IDs per subject slot — parallel to characterSlots. */
  characterSheetSlots?: (string | null)[];
  /**
   * Active source per subject slot:
   * - typed: manager-backed typed entity (character record)
   * - manual: direct uploaded/manual reference slot image
   */
  subjectSlotSourceModes?: ('typed' | 'manual' | null)[];
  /** Location ID assigned to this setup. Plates live on the Location object. */
  locationId?: string | null;
}

/** @deprecated Legacy monolithic shot — use Setup + CoverageShot. Kept as resolved runtime view. */
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
  /** Extra prompt text appended during bake start frame generation. */
  promptAdditions?: string;
  /** User-edited lighting + atmosphere prompt for video generation. */
  lightingAtmospherePrompt?: string;
  /** User-edited bake start frame prompt (pass 1 inpaint). */
  bakeStartFramePrompt?: string;
  /** Crowd type description for bake/video prompts (e.g. "concert audience"). */
  crowdTypePrompt?: string;
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
  /** Shot workflow — drives UI panels and API methods. */
  workflow?: Workflow;
  /** Per-workflow bake/link state so multiple workflows can coexist on one shot. */
  workflowStates?: Partial<Record<Workflow, ShotWorkflowState>>;
  /** User-placed mannequin placeholders (lock-start-frame). */
  mannequins?: Mannequin[];
  /** Inpainted composite used as video start frame. */
  bakedStartFrame?: string | null;
  /** xAI pass 1 result before character identity refinement. */
  bakedIntermediateFrame?: string | null;
  bakeStatus?: BakeStatus;
  /** Newest-first baked frame asset IDs in the project media library. */
  savedBakedFrameAssetIds?: string[];
  /** Active links from shot fields to library assets. */
  linkedAssetIds?: Partial<Record<ShotLinkedAssetKey, string>>;
  workflowSnapshotId?: string | null;
}

export interface StudioProject {
  schemaVersion?: number;
  project: ProjectSettings;
  scenes: Scene[];
  currentSceneId: number;
  setups: Setup[];
  currentSetupId: number;
  currentCoverageShotId: number;
  /** Named characters with their reference sheets — project-level. */
  characters?: Character[];
  /** Named locations with their backdrop plates — project-level. */
  locations?: Location[];
  mediaLibrary?: MediaAsset[];
  shotWorkflowSnapshots?: ShotWorkflowSnapshot[];
  /** @deprecated v17 — migrated to setups on load */
  shots?: Shot[];
  /** @deprecated v17 — migrated to currentSetupId on load */
  currentShot?: number;
  /** @deprecated v1 project-level settings — migrated into each setup on load */
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

export interface ModelSlotConfig {
  categoryId: string;
  providerId: string;
  modelId: string;
  label?: string;
  nativeAudio?: 'none' | 'prompt' | 'voice-bound';
  maxRefs?: number;
  notes?: string;
  status?: 'implemented' | 'partial' | 'planned' | 'experimental';
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
  modelSlots?: Record<string, ModelSlotConfig>;
}

export type ProviderKind = 'aggregator' | 'direct';

export interface LabDefinition {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  /** Lab offers a first-party API wired in VideoGen */
  hasDirectApi: boolean;
  /** Built-in provider id when hasDirectApi is true (e.g. 'kling') */
  directProviderId?: string;
  /** Aggregator provider ids that host this lab's models */
  aggregatorIds: string[];
  /** Model categories this lab's models primarily serve */
  categoryIds: string[];
  notableModels?: string[];
}

export interface BuiltInProvider {
  id: string;
  name: string;
  desc: string;
  icon: string;
  hint: string;
  purposes: string[];
  modalities: Modality[];
  kind: ProviderKind;
  tagline?: string;
}

export interface ScenePreviewPayload {
  project: ProjectSettings;
  camera: CameraSettings;
  lighting: LightingSettings;
  motion: MotionSettings;
  shot: Shot | undefined;
  setup?: Setup;
  coverageShot?: CoverageShot;
}

export type ToastType = 'success' | 'error';

export type PreviewMode = 'vector' | '3d';

export type PreviewSubMode = 'framing' | 'model';

export type BakedImageVariant = 'intermediate' | 'final';
