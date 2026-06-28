export type ImageEditorMode = 'generate' | 'edit';

export const IMAGE_EDITOR_MODES: readonly ImageEditorMode[] = ['generate', 'edit'] as const;

export const DEFAULT_IMAGE_EDITOR_MODE: ImageEditorMode = 'generate';

export function isImageEditorMode(value: string): value is ImageEditorMode {
  return (IMAGE_EDITOR_MODES as readonly string[]).includes(value);
}

export function imageEditorModeRoute(mode: ImageEditorMode = DEFAULT_IMAGE_EDITOR_MODE): string {
  return `/studio/image-editor/${mode}`;
}

export interface ParsedImageEditorPath {
  mode: ImageEditorMode;
}

export function parseImageEditorPathname(pathname: string): ParsedImageEditorPath | null {
  if (pathname === '/studio/image-editor') {
    return { mode: DEFAULT_IMAGE_EDITOR_MODE };
  }

  const match = pathname.match(/^\/studio\/image-editor\/(generate|edit)$/);
  if (!match) return null;

  return { mode: match[1] as ImageEditorMode };
}

export function resolveImageEditorPathRedirect(pathname: string): string | null {
  if (pathname === '/studio/image-editor') {
    return imageEditorModeRoute(DEFAULT_IMAGE_EDITOR_MODE);
  }

  return null;
}

export function isValidImageEditorPathname(pathname: string): boolean {
  return parseImageEditorPathname(pathname) != null;
}

export const IMAGE_EDITOR_MODE_LABELS: Record<ImageEditorMode, string> = {
  generate: 'Generate',
  edit: 'Edit',
};

export const IMAGE_EDITOR_MODE_DESCRIPTIONS: Record<ImageEditorMode, string> = {
  generate: 'Create new images from prompts and references',
  edit: 'Edit references with procedural and AI-powered tools',
};