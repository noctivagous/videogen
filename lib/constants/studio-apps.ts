export type StudioAppId =
  | 'character-sheet-generator'
  | 'location-manager'
  | 'film-look-maker'
  | 'color-palette-maker'
  | 'image-editor';

export interface StudioAppDefinition {
  id: StudioAppId;
  title: string;
  description: string;
}

export const STUDIO_APPS: readonly StudioAppDefinition[] = [
  {
    id: 'character-sheet-generator',
    title: 'Character Manager',
    description: 'Create and manage named characters with reference sheets',
  },
  {
    id: 'location-manager',
    title: 'Location Manager',
    description: 'Create and manage named locations with backdrop plates',
  },
  {
    id: 'film-look-maker',
    title: 'Film Look Maker',
    description: 'Apply cinematic look recipes and film-stock emulations',
  },
  {
    id: 'color-palette-maker',
    title: 'Color Palette Maker',
    description: 'Create and apply color palettes to image references',
  },
  {
    id: 'image-editor',
    title: 'Image Editor',
    description: 'Edit references with procedural and AI-powered tools',
  },
] as const;

export function getStudioApp(id: StudioAppId): StudioAppDefinition {
  const app = STUDIO_APPS.find((entry) => entry.id === id);
  if (!app) throw new Error(`Unknown studio app: ${id}`);
  return app;
}
