/** Canonical IDs and display names for studio UI regions. */
export const UI_SECTIONS = {
  studioRoot: { id: 'studio-root', name: 'Studio Root' },
  studioHeader: { id: 'studio-header', name: 'Header Bar' },
  studioWorkspace: { id: 'studio-workspace', name: 'Workspace' },
  studioCameraPanel: { id: 'studio-camera-panel', name: 'Camera Panel' },
  studioPreviewMain: { id: 'studio-preview-main', name: 'Preview Main' },
  studioLightingPanel: { id: 'studio-lighting-panel', name: 'Lighting Panel' },
  studioBottomBar: { id: 'studio-bottom-bar', name: 'Bottom Bar' },
  studioMobileFab: { id: 'studio-mobile-fab', name: 'Mobile Controls FAB' },
  studioMobileDrawer: { id: 'studio-mobile-drawer', name: 'Mobile Controls Drawer' },
  studioMobileDrawerBackdrop: { id: 'studio-mobile-drawer-backdrop', name: 'Mobile Drawer Backdrop' },
  studioToast: { id: 'studio-toast', name: 'Toast' },
  studioSettingsModal: { id: 'studio-settings-modal', name: 'Settings Modal' },
  studioProviderEditModal: { id: 'studio-provider-edit-modal', name: 'Provider Edit Modal' },

  studioHeaderBrand: { id: 'studio-header-brand', name: 'Header Brand' },
  studioHeaderProjectName: { id: 'studio-header-project-name', name: 'Project Name' },
  studioHeaderProviderBadge: { id: 'studio-header-provider-badge', name: 'Provider Badges' },
  studioHeaderVideoProviderBadge: { id: 'studio-header-video-provider-badge', name: 'Video Provider Badge' },
  studioHeaderImageProviderBadge: { id: 'studio-header-image-provider-badge', name: 'Image Provider Badge' },
  studioHeaderProjectSettings: { id: 'studio-header-project-settings', name: 'Project Settings' },
  studioHeaderActions: { id: 'studio-header-actions', name: 'Header Actions' },

  studioPreviewPanel: { id: 'studio-preview-panel', name: 'Preview Panel' },
  studioPreviewFrame: { id: 'studio-preview-frame', name: 'Preview Frame' },
  studioPreviewContent: { id: 'studio-preview-content', name: 'Preview Content' },
  studioPreviewVectorScene: { id: 'studio-preview-vector-scene', name: 'Reference Preview Scene' },
  studioPreview3dScene: { id: 'studio-preview-3d-scene', name: '3D Preview Scene' },
  studioPreviewPromptStack: { id: 'studio-preview-prompt-stack', name: 'Prompt Stack View' },
  studioPromptTable: { id: 'studio-prompt-table', name: 'Prompt Table' },
  studioPreviewSuccessOverlay: { id: 'studio-preview-success-overlay', name: 'Preview Success Overlay' },
  studioPreviewGeneratingOverlay: { id: 'studio-preview-generating-overlay', name: 'Preview Generating Overlay' },
  studioPreviewCompositionOverlay: { id: 'studio-preview-composition-overlay', name: 'Composition Overlay' },
  studioPreviewFrameViewSegment: { id: 'studio-preview-frame-view-segment', name: 'Frame View Segment' },
  studioPreviewColorPalette: { id: 'studio-preview-color-palette', name: 'Preview Color Palette' },
  studioThemeTransformer: { id: 'studio-theme-transformer', name: 'Theme Transformer' },
  studioThemeTransformerOutlet: { id: 'studio-theme-transformer-outlet', name: 'Theme Transformer Outlet' },
  studioThemeTransformInlet: { id: 'studio-theme-transform-inlet', name: 'Theme Transform Inlet' },
  studioTransformedReference: { id: 'studio-transformed-reference', name: 'Transformed Reference' },
  studioThemeTransformPrompt: { id: 'studio-theme-transform-prompt', name: 'Theme Transform Prompt' },
  studioVideoLightingTechniques: { id: 'studio-video-lighting-techniques', name: 'Video Lighting Techniques' },
  studioVideoLightingTechniqueItem: { id: 'studio-video-lighting-technique-item', name: 'Video Lighting Technique Item' },
  studioVideoEnvironment: { id: 'studio-video-environment', name: 'Video Atmosphere Environment' },
  studioVideoEnvironmentPreset: { id: 'studio-video-environment-preset', name: 'Video Environment Preset' },
  studioPreviewHoverBar: { id: 'studio-preview-hover-bar', name: 'Preview Hover Bar' },
  studioPreviewVideoVersions: { id: 'studio-preview-video-versions', name: 'Generated Video Versions' },
  studioPreviewBlockingLabel: { id: 'studio-preview-blocking-label', name: 'Blocking Preview Label' },
  studioPreviewResolutionBadge: { id: 'studio-preview-resolution-badge', name: 'Resolution Badge' },

  studioCameraControls: { id: 'studio-camera-controls', name: 'Camera Controls' },
  studioCameraFieldSize: { id: 'studio-camera-field-size', name: 'Field Size Dropdown' },
  studioCameraSubjectCount: { id: 'studio-camera-subject-count', name: 'Subject Count Dropdown' },
  studioCameraCoverage: { id: 'studio-camera-coverage', name: 'Coverage Dropdown' },
  studioCameraAngle: { id: 'studio-camera-angle', name: 'Angle Dropdown' },
  studioCameraMovement: { id: 'studio-camera-movement', name: 'Movement Dropdown' },
  studioCameraLens: { id: 'studio-camera-lens', name: 'Lens Dropdown' },
  studioCameraDepthOfField: { id: 'studio-camera-depth-of-field', name: 'Depth of Field Dropdown' },
  studioCameraFrameComposition: { id: 'studio-camera-frame-composition', name: 'Frame Composition Controls' },
  studioCameraMotionSubject: { id: 'studio-camera-motion-subject', name: 'Motion & Subject Controls' },

  studioLookLibrary: { id: 'studio-look-library', name: 'Look Library' },
  studioLookLibraryCategory: { id: 'studio-look-library-category', name: 'Look Library Category' },
  studioLookLibraryRecipe: { id: 'studio-look-library-recipe', name: 'Look Library Recipe' },
  studioColorPalette: { id: 'studio-color-palette', name: 'Color Palette' },
  studioColorPaletteMode: { id: 'studio-color-palette-mode', name: 'Color Palette Mode' },
  studioColorPaletteFxMode: { id: 'studio-color-palette-fx-mode', name: 'Color Palette FX Mode' },
  studioBwTonalRange: { id: 'studio-bw-tonal-range', name: 'B&W Tonal Range' },
  studioLightingControls: { id: 'studio-lighting-controls', name: 'Lighting Controls' },

  studioBottomReferences: { id: 'studio-bottom-references', name: 'Reference Slots' },
  studioBottomPrompt: { id: 'studio-bottom-prompt', name: 'Prompt Input' },
  studioBottomGenerate: { id: 'studio-bottom-generate', name: 'Generate Button' },
  studioBottomShotTimeline: { id: 'studio-bottom-shot-timeline', name: 'Shot Timeline' },

  studioReferenceSlot: { id: 'studio-reference-slot', name: 'Reference Slot' },
  studioShotTimeline: { id: 'studio-shot-timeline', name: 'Shot List' },
  studioShotItem: { id: 'studio-shot-item', name: 'Shot Item' },

  studioSettingsDefaultProvider: { id: 'studio-settings-default-provider', name: 'Default Provider Settings' },
  studioSettingsBuiltInProviders: { id: 'studio-settings-built-in-providers', name: 'Built-in Providers' },
  studioSettingsCustomProviders: { id: 'studio-settings-custom-providers', name: 'Custom Providers' },
  studioSettingsFooter: { id: 'studio-settings-footer', name: 'Settings Modal Footer' },

  studioProviderEditForm: { id: 'studio-provider-edit-form', name: 'Provider Edit Form' },

  studioPromptStackDiagram: { id: 'studio-prompt-stack-diagram', name: 'Payload Diagram Stack' },
  studioPromptStackMermaid: { id: 'studio-prompt-stack-mermaid', name: 'Mermaid Source' },
} as const;

export type UiSection = (typeof UI_SECTIONS)[keyof typeof UI_SECTIONS];
export type UiSectionKey = UiSection['id'];

type UiSectionPropsOptions = {
  /** When false, omit `id` (for components rendered more than once). Default true. */
  id?: boolean;
  /** Append a suffix to section id (e.g. slot index, shot id). */
  suffix?: string | number;
};

/** DOM attributes for referencing a UI section by id and human-readable name. */
export function uiSectionProps(section: UiSection, options?: UiSectionPropsOptions) {
  const sectionId = options?.suffix !== undefined ? `${section.id}-${options.suffix}` : section.id;
  const includeId = options?.id !== false;

  return {
    ...(includeId ? { id: sectionId } : {}),
    'data-ui-section': sectionId,
    'data-ui-section-name': section.name,
  };
}