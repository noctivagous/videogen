import {
  externalizeProjectReferences,
  hydrateProjectReferences,
  revokeProjectAssetUrls,
} from '@/lib/storage/project-assets';
import {
  clearServerProjectStorage,
  isServerProjectStorageEnabled,
  saveProjectToServer,
} from '@/lib/storage/server-project-storage';
import {
  readGlobalMediaFromDirectory,
  writeGlobalMediaToDirectory,
} from '@/lib/storage/global-media-storage';
import type { MediaAsset } from '@/lib/types/media-library';
import {
  clearProjectLocation,
  loadProjectLocation,
  saveProjectLocation,
  type StoredProjectLocation,
  type StoredProjectLocationKind,
} from '@/lib/storage/project-handle-store';
import type { StudioProject } from '@/lib/types/studio';
import { validateStudioProject } from '@/lib/storage/project-io';

export const PROJECT_JSON_NAME = 'project.json';

export type ProjectSaveState = 'saved' | 'dirty' | 'none';
export type ProjectLocationKind = 'directory' | 'file' | null;

type FilePickerWindow = Window & {
  showDirectoryPicker?: (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
  showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};

let activeDirectory: FileSystemDirectoryHandle | null = null;
let activeFile: FileSystemFileHandle | null = null;
let locationLabel: string | null = null;
let saveState: ProjectSaveState = 'none';

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let autosaveGeneration = 0;

export type FileSystemAccessTier = 'directory' | 'file-only' | 'download' | 'none';

export type FileSystemAccessBlockReason = 'ssr' | 'insecure-context' | 'api-unavailable';

export interface FileSystemAccessStatus {
  /** Best available tier — native folder, native file, download fallback, or none. */
  tier: FileSystemAccessTier;
  /** True when project JSON can be saved or loaded (any tier except none). */
  supported: boolean;
  reason: FileSystemAccessTier | FileSystemAccessBlockReason;
}

function getPickerWindow(): FilePickerWindow | null {
  if (typeof window === 'undefined') return null;
  return window as FilePickerWindow;
}

function hasDirectoryPicker(): boolean {
  const win = getPickerWindow();
  if (!win) return false;
  try {
    return typeof win.showDirectoryPicker === 'function';
  } catch {
    return false;
  }
}

function hasFilePickers(): boolean {
  const win = getPickerWindow();
  if (!win) return false;
  try {
    return (
      typeof win.showOpenFilePicker === 'function'
      || typeof win.showSaveFilePicker === 'function'
    );
  } catch {
    return false;
  }
}

function hasDownloadFallback(): boolean {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

export function getFileSystemAccessStatus(): FileSystemAccessStatus {
  if (typeof window === 'undefined') {
    return { tier: 'none', supported: false, reason: 'ssr' };
  }

  const secure = window.isSecureContext;

  if (secure && hasDirectoryPicker()) {
    return { tier: 'directory', supported: true, reason: 'directory' };
  }
  if (secure && hasFilePickers()) {
    return { tier: 'file-only', supported: true, reason: 'file-only' };
  }
  if (hasDownloadFallback()) {
    return {
      tier: 'download',
      supported: true,
      reason: secure ? 'api-unavailable' : 'insecure-context',
    };
  }

  return { tier: 'none', supported: false, reason: 'api-unavailable' };
}

/** Native File System Access API pickers (folder or persistent file handle). */
export function isNativeFilePickerSupported(): boolean {
  const { tier } = getFileSystemAccessStatus();
  return tier === 'directory' || tier === 'file-only';
}

export function isFileSystemAccessSupported(): boolean {
  return getFileSystemAccessStatus().supported;
}

export function isDirectoryAccessSupported(): boolean {
  return getFileSystemAccessStatus().tier === 'directory';
}

export function getProjectLocationLabel(): string | null {
  return locationLabel;
}

export function getProjectSaveState(): ProjectSaveState {
  return saveState;
}

export function hasOpenProjectLocation(): boolean {
  return Boolean(activeDirectory || activeFile);
}

export function hasProjectDirectory(): boolean {
  return Boolean(activeDirectory);
}

export function getProjectLocationKind(): ProjectLocationKind {
  if (activeDirectory) return 'directory';
  if (activeFile) return 'file';
  return null;
}

function setLocation(
  kind: StoredProjectLocationKind,
  handle: FileSystemDirectoryHandle | FileSystemFileHandle,
  name: string,
) {
  if (kind === 'directory') {
    activeDirectory = handle as FileSystemDirectoryHandle;
    activeFile = null;
  } else {
    activeFile = handle as FileSystemFileHandle;
    activeDirectory = null;
  }
  locationLabel = name;
  saveState = 'saved';
}

export function clearProjectLocationSession(): void {
  activeDirectory = null;
  activeFile = null;
  locationLabel = null;
  saveState = 'none';
  revokeProjectAssetUrls();
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  void clearProjectLocation();
}

async function ensureWritePermission(
  handle: FileSystemDirectoryHandle | FileSystemFileHandle,
): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

async function ensureProjectSubdirs(dir: FileSystemDirectoryHandle): Promise<void> {
  await dir.getDirectoryHandle('assets', { create: true });
  await dir.getDirectoryHandle('generated', { create: true });
}

function serializeProject(project: StudioProject): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export async function writeProjectToDirectory(
  dir: FileSystemDirectoryHandle,
  project: StudioProject,
): Promise<void> {
  await ensureProjectSubdirs(dir);
  const diskProject = await externalizeProjectReferences(dir, project);
  const fileHandle = await dir.getFileHandle(PROJECT_JSON_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(serializeProject(diskProject));
  await writable.close();
}

export async function writeProjectToFileHandle(
  fileHandle: FileSystemFileHandle,
  project: StudioProject,
): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(serializeProject(project));
  await writable.close();
}

export async function readProjectFromDirectory(
  dir: FileSystemDirectoryHandle,
): Promise<StudioProject | null> {
  try {
    const fileHandle = await dir.getFileHandle(PROJECT_JSON_NAME);
    const file = await fileHandle.getFile();
    const parsed = JSON.parse(await file.text()) as unknown;
    const validated = validateStudioProject(parsed);
    if (!validated) return null;
    return hydrateProjectReferences(dir, validated);
  } catch {
    return null;
  }
}

export async function readProjectFromFileHandle(
  fileHandle: FileSystemFileHandle,
): Promise<StudioProject | null> {
  try {
    const file = await fileHandle.getFile();
    const parsed = JSON.parse(await file.text()) as unknown;
    return validateStudioProject(parsed);
  } catch {
    return null;
  }
}

async function persistActiveLocation(): Promise<void> {
  const handle = activeDirectory ?? activeFile;
  if (!handle || !locationLabel) return;
  const kind: StoredProjectLocationKind = activeDirectory ? 'directory' : 'file';
  await saveProjectLocation({ kind, name: locationLabel, handle });
}

async function activateDirectory(dir: FileSystemDirectoryHandle): Promise<boolean> {
  if (!(await ensureWritePermission(dir))) return false;
  setLocation('directory', dir, dir.name);
  await persistActiveLocation();
  if (isServerProjectStorageEnabled()) {
    void clearServerProjectStorage();
  }
  return true;
}

async function activateFile(fileHandle: FileSystemFileHandle): Promise<StudioProject | null> {
  if (!(await ensureWritePermission(fileHandle))) return null;
  setLocation('file', fileHandle, fileHandle.name);
  await persistActiveLocation();
  if (isServerProjectStorageEnabled()) {
    void clearServerProjectStorage();
  }
  return readProjectFromFileHandle(fileHandle);
}

export async function saveProjectFolderAs(
  project: StudioProject,
  globalMediaLibrary: MediaAsset[] = [],
): Promise<boolean> {
  const win = window as FilePickerWindow;
  if (!win.showDirectoryPicker) return false;

  const dir = await win.showDirectoryPicker({
    mode: 'readwrite',
    id: 'videogen-project-folder',
  });

  revokeProjectAssetUrls();
  await writeProjectToDirectory(dir, project);
  await writeGlobalMediaToDirectory(dir, globalMediaLibrary);
  return activateDirectory(dir);
}

export type OpenProjectBundle = {
  project: StudioProject;
  globalMediaLibrary: MediaAsset[];
};

export async function openProjectFolder(): Promise<OpenProjectBundle | null> {
  const win = window as FilePickerWindow;
  if (!win.showDirectoryPicker) return null;

  const dir = await win.showDirectoryPicker({
    mode: 'readwrite',
    id: 'videogen-project-folder',
  });

  revokeProjectAssetUrls();
  const project = await readProjectFromDirectory(dir);
  if (!project) return null;

  if (!(await activateDirectory(dir))) return null;
  const globalMediaLibrary = await readGlobalMediaFromDirectory(dir);
  return { project, globalMediaLibrary };
}

export async function openProjectFile(): Promise<StudioProject | null> {
  const win = window as FilePickerWindow;
  if (!win.showOpenFilePicker) return null;

  const [fileHandle] = await win.showOpenFilePicker({
    types: [{ description: 'VideoGen project', accept: { 'application/json': ['.json'] } }],
    multiple: false,
  });

  const project = await readProjectFromFileHandle(fileHandle);
  if (!project) return null;

  await activateFile(fileHandle);
  return project;
}

export async function saveProjectFileAs(project: StudioProject): Promise<boolean> {
  const win = window as FilePickerWindow;
  if (!win.showSaveFilePicker) return false;

  const fileHandle = await win.showSaveFilePicker({
    suggestedName: `${project.project.name || 'project'}.json`,
    types: [{ description: 'VideoGen project', accept: { 'application/json': ['.json'] } }],
  });

  await writeProjectToFileHandle(fileHandle, project);
  await activateFile(fileHandle);
  return true;
}

export function getCurrentStoredLocation(): StoredProjectLocation | null {
  const handle = activeDirectory ?? activeFile;
  if (!handle || !locationLabel) return null;
  const kind: StoredProjectLocationKind = activeDirectory ? 'directory' : 'file';
  return { kind, name: locationLabel, handle };
}

export async function openStoredProjectLocation(
  stored: StoredProjectLocation,
): Promise<OpenProjectBundle | null> {
  if (!(await ensureWritePermission(stored.handle))) {
    return null;
  }

  revokeProjectAssetUrls();

  if (stored.kind === 'directory') {
    activeDirectory = stored.handle as FileSystemDirectoryHandle;
    activeFile = null;
    locationLabel = stored.name;
    saveState = 'saved';
    await saveProjectLocation(stored);
    const project = await readProjectFromDirectory(activeDirectory);
    if (!project) return null;
    const globalMediaLibrary = await readGlobalMediaFromDirectory(activeDirectory);
    return { project, globalMediaLibrary };
  }

  activeFile = stored.handle as FileSystemFileHandle;
  activeDirectory = null;
  locationLabel = stored.name;
  saveState = 'saved';
  await saveProjectLocation(stored);
  const project = await readProjectFromFileHandle(activeFile);
  return project ? { project, globalMediaLibrary: [] } : null;
}

export async function restoreProjectSession(): Promise<OpenProjectBundle | null> {
  const stored = await loadProjectLocation();
  if (!stored) return null;
  return openStoredProjectLocation(stored);
}

export async function flushProjectAutosave(
  project: StudioProject,
  globalMediaLibrary: MediaAsset[] = [],
): Promise<boolean> {
  const generation = autosaveGeneration;

  if (activeDirectory) {
    if (!(await ensureWritePermission(activeDirectory))) {
      saveState = 'dirty';
      return false;
    }
    await writeProjectToDirectory(activeDirectory, project);
    await writeGlobalMediaToDirectory(activeDirectory, globalMediaLibrary);
    if (generation !== autosaveGeneration) return false;
    saveState = 'saved';
    return true;
  }

  if (activeFile) {
    if (!(await ensureWritePermission(activeFile))) {
      saveState = 'dirty';
      return false;
    }
    await writeProjectToFileHandle(activeFile, project);
    if (generation !== autosaveGeneration) return false;
    saveState = 'saved';
    return true;
  }

  if (isServerProjectStorageEnabled()) {
    try {
      const saved = await saveProjectToServer(project, globalMediaLibrary);
      if (saved && generation === autosaveGeneration) {
        saveState = 'saved';
        return true;
      }
    } catch {
      // fall through to dirty
    }
  }

  saveState = 'dirty';
  return false;
}

export function scheduleProjectAutosave(
  project: StudioProject,
  onUpdate?: (state: ProjectSaveState) => void,
  globalMediaLibrary: MediaAsset[] = [],
): void {
  if (typeof window === 'undefined') return;

  if (!activeDirectory && !activeFile) {
    if (isServerProjectStorageEnabled()) {
      saveState = 'dirty';
      onUpdate?.('dirty');
      autosaveGeneration += 1;
      const generation = autosaveGeneration;
      if (autosaveTimer) clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(() => {
        void (async () => {
          try {
            await flushProjectAutosave(project, globalMediaLibrary);
            if (generation === autosaveGeneration) {
              onUpdate?.(saveState);
            }
          } catch {
            saveState = 'dirty';
            if (generation === autosaveGeneration) {
              onUpdate?.('dirty');
            }
          }
        })();
      }, 800);
      return;
    }
    saveState = 'dirty';
    onUpdate?.('dirty');
    return;
  }

  saveState = 'dirty';
  onUpdate?.('dirty');

  autosaveGeneration += 1;
  const generation = autosaveGeneration;

  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    void (async () => {
      try {
        await flushProjectAutosave(project, globalMediaLibrary);
        if (generation === autosaveGeneration) {
          onUpdate?.(saveState);
        }
      } catch {
        saveState = 'dirty';
        if (generation === autosaveGeneration) {
          onUpdate?.('dirty');
        }
      }
    })();
  }, 800);
}

export async function saveProjectNow(
  project: StudioProject,
  globalMediaLibrary: MediaAsset[] = [],
): Promise<boolean> {
  autosaveGeneration += 1;
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  return flushProjectAutosave(project, globalMediaLibrary);
}