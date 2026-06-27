const MAC_PLATFORM_PATTERN = /mac|iphone|ipad|ipod/i;
const NON_MAC_ALT_SYMBOL = '⎇';

const ARROW_SHORTCUT_LABELS = {
  left: { mac: '⌥←', other: `${NON_MAC_ALT_SYMBOL}←` },
  right: { mac: '⌥→', other: `${NON_MAC_ALT_SYMBOL}→` },
} as const;

export function isMacPlatform(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''): boolean {
  return MAC_PLATFORM_PATTERN.test(userAgent);
}

export function formatAltShortcut(key: string, userAgent?: string): string {
  const normalizedKey = key.toUpperCase();
  if (isMacPlatform(userAgent)) {
    return `⌥${normalizedKey}`;
  }
  return `${NON_MAC_ALT_SYMBOL}${normalizedKey}`;
}

export function formatAltArrowShortcut(direction: 'left' | 'right', userAgent?: string): string {
  return isMacPlatform(userAgent)
    ? ARROW_SHORTCUT_LABELS[direction].mac
    : ARROW_SHORTCUT_LABELS[direction].other;
}
