export type ColorPaletteMakerTab = 'maker' | 'library';

export const COLOR_PALETTE_MAKER_TABS: readonly ColorPaletteMakerTab[] = ['maker', 'library'] as const;

export const DEFAULT_COLOR_PALETTE_MAKER_TAB: ColorPaletteMakerTab = 'maker';

export function isColorPaletteMakerTab(value: string): value is ColorPaletteMakerTab {
  return (COLOR_PALETTE_MAKER_TABS as readonly string[]).includes(value);
}

export function colorPaletteMakerTabRoute(tab: ColorPaletteMakerTab = DEFAULT_COLOR_PALETTE_MAKER_TAB): string {
  return `/studio/color-palette-maker/${tab}`;
}

export interface ParsedColorPaletteMakerPath {
  tab: ColorPaletteMakerTab;
}

export function parseColorPaletteMakerPathname(pathname: string): ParsedColorPaletteMakerPath | null {
  if (pathname === '/studio/color-palette-maker') {
    return { tab: DEFAULT_COLOR_PALETTE_MAKER_TAB };
  }

  const match = pathname.match(/^\/studio\/color-palette-maker\/(maker|library)$/);
  if (!match) return null;

  return { tab: match[1] as ColorPaletteMakerTab };
}

export function resolveColorPaletteMakerPathRedirect(pathname: string): string | null {
  if (pathname === '/studio/color-palette-maker') {
    return colorPaletteMakerTabRoute(DEFAULT_COLOR_PALETTE_MAKER_TAB);
  }

  return null;
}

export function isValidColorPaletteMakerPathname(pathname: string): boolean {
  return parseColorPaletteMakerPathname(pathname) != null;
}

export const COLOR_PALETTE_MAKER_TAB_LABELS: Record<ColorPaletteMakerTab, string> = {
  maker: 'Maker',
  library: 'Library',
};

export const COLOR_PALETTE_MAKER_TAB_DESCRIPTIONS: Record<ColorPaletteMakerTab, string> = {
  maker: 'Create and apply color palettes to image references',
  library: 'Browse saved color palette collections',
};