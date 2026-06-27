import { isRemoteProviderUrl } from '@/lib/storage/project-media-paths';

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /\.local$/i,
];

/** Remote http(s) URLs safe to archive via server-side fetch (SSRF guard). */
export function isArchivableRemoteMediaUrl(url: string): boolean {
  if (!isRemoteProviderUrl(url)) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return !PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(host));
  } catch {
    return false;
  }
}
