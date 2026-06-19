/**
 * When true, projects without a linked folder are autosaved on the server
 * (blobs + ingested provider media URLs). Set to false to disable.
 */
export const ALLOW_SERVER_PROJECT_STORAGE =
  process.env.NEXT_PUBLIC_ALLOW_SERVER_PROJECT_STORAGE !== 'false';