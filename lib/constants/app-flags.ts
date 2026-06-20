/**
 * When true, projects without a linked folder are autosaved on the server
 * (blobs + ingested provider media URLs). Set to false to disable.
 */
export const ALLOW_SERVER_PROJECT_STORAGE =
  process.env.NEXT_PUBLIC_ALLOW_SERVER_PROJECT_STORAGE !== 'false';

/**
 * Dev only: all browsers on localhost share one server session (fixed id).
 * Requires ALLOW_SERVER_PROJECT_STORAGE. Disable before File System API workflow.
 */
export const SERVER_PROJECT_STORAGE_DEV_MODE =
  process.env.NEXT_PUBLIC_SERVER_PROJECT_STORAGE_DEV_MODE === 'true';

export const SERVER_PROJECT_STORAGE_DEV_SESSION =
  process.env.NEXT_PUBLIC_SERVER_PROJECT_STORAGE_DEV_SESSION?.trim() ||
  'videogen-local-dev';

/**
 * Dev only: fetch remote provider media URLs and store under .data/server-projects.
 * When false (default), project.json keeps original https URLs so all browsers share them.
 */
export const SERVER_PROJECT_STORAGE_DEV_DOWNLOAD_MEDIA_URLS =
  process.env.NEXT_PUBLIC_SERVER_PROJECT_STORAGE_DEV_DOWNLOAD_MEDIA_URLS === 'true';