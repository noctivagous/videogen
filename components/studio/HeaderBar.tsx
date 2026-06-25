'use client';

import { useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { AppsLauncherMenu } from '@/components/studio/AppsLauncherMenu';
import { ProjectSwitcherDropdown } from '@/components/studio/ProjectSwitcherDropdown';
import { ProviderBadge } from '@/components/studio/ProviderBadge';
import { SplitButton } from '@/components/ui/SplitButton';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getStudioPanelTitle } from '@/lib/constants/studio-launcher';
import {
  getBuiltInProvider,
  getProviderStatus,
  getSelectedImageModelDisplay,
  getSelectedVideoModelDisplay,
} from '@/lib/studio/provider-modalities';
import { isCustomProvider, isProviderConnected } from '@/lib/storage/ai-settings';
import { useFileSystemAccess } from '@/hooks/use-file-system-access';
import {
  ALLOW_SERVER_PROJECT_STORAGE,
  SERVER_PROJECT_STORAGE_DEV_MODE,
} from '@/lib/constants/app-flags';
import type {
  FileSystemAccessStatus,
  ProjectLocationKind,
  ProjectSaveState,
} from '@/lib/storage/file-project';
import { useStudioStore } from '@/store/useStudioStore';

function fileAccessBlockedCopy(
  status: FileSystemAccessStatus,
): { headline: string; detail: string } {
  switch (status.reason) {
    case 'insecure-context':
      return {
        headline: 'HTTPS or localhost required',
        detail: 'File saving needs a secure context — use https://… or http://localhost',
      };
    case 'api-unavailable':
      return {
        headline: 'File saving unavailable',
        detail: 'This browser does not support the File System Access API',
      };
    default:
      return {
        headline: 'Checking file support…',
        detail: 'Detecting File System Access API',
      };
  }
}

function folderStatusCopy(
  kind: ProjectLocationKind,
  saveState: ProjectSaveState,
  fileAccess: FileSystemAccessStatus,
): { headline: string; detail: string; dotClass: string; urgent: boolean } {
  if (!fileAccess.supported) {
    const blocked = fileAccessBlockedCopy(fileAccess);
    return {
      ...blocked,
      dotClass: 'bg-gray-500',
      urgent: fileAccess.reason !== 'ssr',
    };
  }
  if (
    SERVER_PROJECT_STORAGE_DEV_MODE &&
    ALLOW_SERVER_PROJECT_STORAGE &&
    kind !== 'directory' &&
    kind !== 'file'
  ) {
    return {
      headline: 'Dev: shared server session',
      detail:
        saveState === 'saved'
          ? 'All browsers on localhost share this project'
          : 'Saving shared dev project to server…',
      dotClass: saveState === 'saved' ? 'bg-emerald-400' : 'bg-amber-500',
      urgent: false,
    };
  }
  if (
    (fileAccess.tier === 'file-only' || fileAccess.tier === 'download')
    && kind !== 'directory'
    && kind !== 'file'
  ) {
    const insecure = fileAccess.reason === 'insecure-context';
    return {
      headline: 'JSON save & load available',
      detail: insecure
        ? 'Use localhost or HTTPS for folder access'
        : fileAccess.tier === 'download'
          ? 'Save or open project JSON from the project menu'
          : 'Open or save project JSON — folder autosave needs directory picker support',
      dotClass: 'bg-amber-500',
      urgent: false,
    };
  }
  if (kind === 'directory') {
    if (saveState === 'saved') {
      return {
        headline: 'Saved to disk',
        detail: 'Autosaving to your project folder',
        dotClass: 'bg-emerald-400',
        urgent: false,
      };
    }
    return {
      headline: 'Saving changes…',
      detail: 'Updates will be written to your project folder',
      dotClass: 'bg-amber-500',
      urgent: false,
    };
  }
  if (kind === 'file') {
    return {
      headline: 'JSON file only',
      detail: 'Choose a project folder for assets & autosave',
      dotClass: 'bg-amber-500',
      urgent: true,
    };
  }
  if (ALLOW_SERVER_PROJECT_STORAGE && saveState === 'saved') {
    return {
      headline: 'No project folder',
      detail: 'Backed up on server — choose a folder to save locally',
      dotClass: 'bg-emerald-400',
      urgent: true,
    };
  }
  return {
    headline: 'No project folder',
    detail: saveState === 'dirty'
      ? ALLOW_SERVER_PROJECT_STORAGE
        ? 'Saving to server — choose a folder for local copy'
        : 'Edits exist only in this tab — set up a folder to keep them'
      : 'Choose a folder on your computer to save this project',
    dotClass: 'bg-amber-500',
    urgent: true,
  };
}

function ProjectFolderBadge({
  label,
  kind,
  saveState,
  fileAccess,
  onSaveFolder,
  onOpenFolder,
  onSaveNow,
}: {
  label: string | null;
  kind: ProjectLocationKind;
  saveState: ProjectSaveState;
  fileAccess: FileSystemAccessStatus;
  onSaveFolder: () => void;
  onOpenFolder: () => void;
  onSaveNow: () => void;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const status = folderStatusCopy(kind, saveState, fileAccess);
  const fileApiSupported = fileAccess.supported;
  const directoryApiSupported = fileAccess.tier === 'directory';
  const nativeFileApiSupported = fileAccess.tier === 'directory' || fileAccess.tier === 'file-only';
  const hasDirectory = kind === 'directory';

  return (
    <div className="relative flex-shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setPanelOpen((open) => !open)}
        onBlur={() => setTimeout(() => setPanelOpen(false), 150)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs min-w-0 max-w-[11rem] sm:max-w-[13rem] lg:max-w-[15rem] border transition-all text-left ${
          status.urgent
            ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/60 hover:bg-amber-500/15'
            : 'bg-surface-800 border-surface-600 hover:bg-surface-700 hover:border-surface-500'
        }`}
        aria-expanded={panelOpen}
        aria-haspopup="dialog"
        title="Project folder on disk — click for details"
      >
        <svg className={`w-3.5 h-3.5 flex-shrink-0 ${status.urgent ? 'text-amber-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <div className="min-w-0 leading-tight flex-1">
          {hasDirectory && label ? (
            <div className="text-gray-300 truncate font-medium">{label}</div>
          ) : (
            <div className={`truncate font-medium ${status.urgent ? 'text-amber-200' : 'text-gray-300'}`}>
              {status.headline}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dotClass}`} />
            <span className="truncate">
              {hasDirectory && label ? status.headline : status.detail}
            </span>
          </div>
        </div>
        <span className="text-gray-500 text-[10px] flex-shrink-0" aria-hidden>▾</span>
      </button>

      {panelOpen && (
        <div
          role="dialog"
          aria-label="Project folder status"
          className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-[60] p-3 text-sm"
        >
          <div className="flex items-start gap-2 mb-2">
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${status.dotClass}`} />
            <div className="min-w-0">
              <div className="font-medium text-gray-200">{status.headline}</div>
              {hasDirectory && label ? (
                <div className="text-xs text-gray-400 truncate mt-0.5">{label}</div>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            {!fileApiSupported ? (
              fileAccess.reason === 'insecure-context' ? (
                <>
                  File saving requires a <span className="text-gray-300">secure connection</span>. The File System Access API is only available on HTTPS or <span className="text-gray-300">http://localhost</span> — not on plain HTTP via a network IP or custom hostname.
                </>
              ) : fileAccess.reason === 'api-unavailable' ? (
                <>
                  This browser does not expose the File System Access API.
                </>
              ) : (
                <>
                  Detecting whether this browser can save project files…
                </>
              )
            ) : (fileAccess.tier === 'file-only' || fileAccess.tier === 'download') && !hasDirectory && kind !== 'file' ? (
              <>
                {fileAccess.reason === 'insecure-context' ? (
                  <>
                    Open VideoGen at <span className="text-gray-300">http://localhost</span> or HTTPS to unlock native file and folder pickers. You can still <span className="text-gray-300">download or upload JSON</span> project files from the project menu.
                  </>
                ) : fileAccess.tier === 'download' ? (
                  <>
                    Native file pickers were not detected in this browser build. Use <span className="text-gray-300">Save JSON</span> or <span className="text-gray-300">Open JSON</span> from the project menu — or try Chrome, Edge, or Safari 15.2+ on localhost for folder autosave.
                  </>
                ) : (
                  <>
                    This browser supports saving and opening <span className="text-gray-300">JSON project files</span> but not project folders. Use Save JSON or Open JSON from the project menu. For folder autosave with assets, use a browser with directory picker support (Chrome, Edge, or recent Safari).
                  </>
                )}
              </>
            ) : hasDirectory ? (
              <>
                VideoGen has access to a folder on your computer. It autosaves{' '}
                <span className="text-gray-300">project.json</span>, reference images in{' '}
                <span className="text-gray-300">assets/</span>, and will store generated videos in{' '}
                <span className="text-gray-300">generated/</span>.
              </>
            ) : kind === 'file' ? (
              <>
                This project is linked to a single JSON file. Reference images and generated videos need a project folder. Choose a folder to move to full on-disk saving.
              </>
            ) : (
              <>
                This project is not linked to a folder yet. Pick or create a folder on your computer so VideoGen can autosave your work — otherwise it only lives in this browser tab.
              </>
            )}
          </p>

          {fileApiSupported && (
            <div className="flex flex-col gap-1.5">
              {!hasDirectory ? (
                <>
                  {directoryApiSupported ? (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
                      onClick={() => { onSaveFolder(); setPanelOpen(false); }}
                    >
                      Choose project folder…
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
                      onClick={() => { onSaveNow(); setPanelOpen(false); }}
                    >
                      {nativeFileApiSupported ? 'Save JSON file…' : 'Download project JSON…'}
                    </button>
                  )}
                  {directoryApiSupported ? (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-gray-300 transition-colors"
                      onClick={() => { onOpenFolder(); setPanelOpen(false); }}
                    >
                      Open existing project folder…
                    </button>
                  ) : null}
                </>
              ) : (
                <>
                  {saveState === 'dirty' && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
                      onClick={() => { onSaveNow(); setPanelOpen(false); }}
                    >
                      Save now
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-gray-300 transition-colors"
                    onClick={() => { onOpenFolder(); setPanelOpen(false); }}
                  >
                    Open different folder…
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-gray-300 transition-colors"
                    onClick={() => { onSaveFolder(); setPanelOpen(false); }}
                  >
                    Save copy to new folder…
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HeaderBar() {
  const ai = useStudioStore((s) => s.ai);
  const projectLocationLabel = useStudioStore((s) => s.projectLocationLabel);
  const projectLocationKind = useStudioStore((s) => s.projectLocationKind);
  const projectSaveState = useStudioStore((s) => s.projectSaveState);
  const fileAccess = useFileSystemAccess();
  const fileApiSupported = fileAccess.supported;
  const saveProject = useStudioStore((s) => s.saveProject);
  const saveProjectQuick = useStudioStore((s) => s.saveProjectQuick);
  const loadProject = useStudioStore((s) => s.loadProject);
  const openProjectQuick = useStudioStore((s) => s.openProjectQuick);
  const openProjectFolder = useStudioStore((s) => s.openProjectFolder);
  const saveProjectFolderAs = useStudioStore((s) => s.saveProjectFolderAs);
  const newProject = useStudioStore((s) => s.newProject);
  const exportVideo = useStudioStore((s) => s.exportVideo);
  const openSettings = useStudioStore((s) => s.openSettings);
  const workspaceView = useStudioStore((s) => s.workspaceView);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const videoDisplay = getSelectedVideoModelDisplay(ai);
  const imageDisplay = getSelectedImageModelDisplay(ai);
  const isCustomVideo = isCustomProvider(ai.defaultVideoProvider, ai);
  const isCustomImage = isCustomProvider(ai.defaultImageProvider, ai);
  const videoConnected = isProviderConnected(ai.defaultVideoProvider, isCustomVideo, ai);
  const imageConnected = isProviderConnected(ai.defaultImageProvider, isCustomImage, ai);
  const videoStatus = getProviderStatus(ai.defaultVideoProvider, isCustomVideo, ai);
  const imageStatus = getProviderStatus(ai.defaultImageProvider, isCustomImage, ai);

  const saveQuickTitle = fileApiSupported
    ? fileAccess.tier === 'directory'
      ? projectLocationLabel
        ? 'Save project to open folder'
        : 'Save project folder'
      : 'Save project as JSON'
    : 'Save project as JSON';
  const openQuickTitle = fileApiSupported
    ? fileAccess.tier === 'directory'
      ? 'Open project folder'
      : 'Open project JSON file'
    : 'Load project from JSON';

  return (
    <header
      className="border-b border-surface-700 h-16 flex items-center justify-between px-4 md:px-6 z-50"
      {...uiSectionProps(UI_SECTIONS.studioHeader)}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0" {...uiSectionProps(UI_SECTIONS.studioHeaderBrand)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-lg hidden sm:block">VideoGen</span>
        </div>

        <div className="h-8 w-px bg-surface-600 hidden md:block flex-shrink-0" />

        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <label className="text-[10px] uppercase tracking-wider text-gray-500">Studio</label>
          <SplitButton
            label={getStudioPanelTitle(workspaceView)}
            primaryAction="toggle-menu"
            menuAction="toggle-menu"
            renderMenu={(closeMenu) => <AppsLauncherMenu onDismiss={closeMenu} />}
            primaryUiSection={uiSectionProps(UI_SECTIONS.studioHeaderAppsSplit)}
            menuUiSection={uiSectionProps(UI_SECTIONS.studioHeaderAppsMenu)}
          />
        </div>

        <div className="h-8 w-px bg-surface-600 hidden md:block flex-shrink-0" />

        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 hidden sm:block">Project</label>
          <ProjectSwitcherDropdown />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="px-2 py-1.5 text-xs bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-lg transition-all"
              title="Project actions"
            >
              ▾
            </button>
            {menuOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 py-1 text-sm">
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { newProject(); setMenuOpen(false); }}>New project</button>
                <div className="h-px bg-surface-600 my-1" />
                <button
                  type="button"
                  title={saveQuickTitle}
                  onClick={() => { void saveProjectQuick().then(() => setMenuOpen(false)); }}
                  className="w-full text-left px-3 py-2 hover:bg-surface-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </button>
                <button
                  type="button"
                  title={openQuickTitle}
                  onClick={() => { void openProjectQuick().then(() => setMenuOpen(false)); }}
                  className="w-full text-left px-3 py-2 hover:bg-surface-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Open
                </button>
                <div className="h-px bg-surface-600 my-1" />
                {fileApiSupported ? (
                  <>
                    {fileAccess.tier === 'directory' ? (
                      <>
                        <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { void openProjectFolder().then(() => setMenuOpen(false)); }}>Open folder…</button>
                        <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { void saveProjectFolderAs().then(() => setMenuOpen(false)); }}>Save folder as…</button>
                        <div className="h-px bg-surface-600 my-1" />
                      </>
                    ) : null}
                    <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { void saveProject().then(() => setMenuOpen(false)); }}>Save JSON file…</button>
                    <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { void loadProject().then(() => setMenuOpen(false)); }}>Open JSON file…</button>
                  </>
                ) : (
                  <>
                    <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { void saveProject().then(() => setMenuOpen(false)); }}>Save project…</button>
                    <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { void loadProject().then(() => setMenuOpen(false)); }}>Load project…</button>
                  </>
                )}
                <div className="h-px bg-surface-600 my-1" />
                <button
                  type="button"
                  disabled
                  title="Export coming soon"
                  onClick={exportVideo}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
              </div>
            )}
          </div>

          <ProjectFolderBadge
            label={projectLocationLabel}
            kind={projectLocationKind}
            saveState={projectSaveState}
            fileAccess={fileAccess}
            onSaveFolder={() => void saveProjectFolderAs()}
            onOpenFolder={() => void openProjectFolder()}
            onSaveNow={() => void saveProjectQuick()}
          />
        </div>

        <div className="h-8 w-px bg-surface-600 hidden md:block flex-shrink-0" />

        <div className="hidden sm:flex items-center gap-2 min-w-0" {...uiSectionProps(UI_SECTIONS.studioHeaderProviderBadge)}>
          <ProviderBadge
            kind="Video"
            providerId={isCustomVideo ? undefined : ai.defaultVideoProvider}
            fallbackIcon={isCustomVideo ? '🛠️' : getBuiltInProvider(ai.defaultVideoProvider)?.icon ?? '🔌'}
            providerName={videoDisplay.providerName}
            modelLabel={videoDisplay.modelLabel}
            connected={videoConnected}
            status={videoStatus}
            sectionId={UI_SECTIONS.studioHeaderVideoProviderBadge.id}
          />
          <ProviderBadge
            kind="Image"
            providerId={isCustomImage ? undefined : ai.defaultImageProvider}
            fallbackIcon={isCustomImage ? '🛠️' : getBuiltInProvider(ai.defaultImageProvider)?.icon ?? '🔌'}
            providerName={imageDisplay.providerName}
            modelLabel={imageDisplay.modelLabel}
            connected={imageConnected}
            status={imageStatus}
            sectionId={UI_SECTIONS.studioHeaderImageProviderBadge.id}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0" {...uiSectionProps(UI_SECTIONS.studioHeaderActions)}>
        <button
          type="button"
          onClick={openSettings}
          className="p-2 hover:bg-surface-700 rounded-lg transition-all group border border-surface-600 hover:border-surface-500"
          title="AI Providers, Models & API Keys"
        >
          <Settings className="w-5 h-5 text-gray-400 group-hover:text-white" aria-hidden />
        </button>
      </div>
    </header>
  );
}