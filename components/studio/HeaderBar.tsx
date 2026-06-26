'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Clapperboard,
  ImageIcon,
  Library,
  Palette,
  Settings,
  Users,
  Video,
} from 'lucide-react';
import { AppsLauncherMenu } from '@/components/studio/AppsLauncherMenu';
import { HeaderLegendContainer } from '@/components/studio/HeaderLegendContainer';
import { ProjectSwitcherDropdown } from '@/components/studio/ProjectSwitcherDropdown';
import { ProviderBadge } from '@/components/studio/ProviderBadge';
import { StudioLauncherIconBar } from '@/components/studio/StudioLauncherIconBar';
import { SplitButton } from '@/components/ui/SplitButton';
import { MODEL_CATEGORY_DEFINITIONS, type ModelCategoryId } from '@/lib/constants/model-catalog';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getStudioPanelTitle } from '@/lib/constants/studio-launcher';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import {
  getBuiltInProvider,
  getProviderStatus,
  resolveModelSelectionForProviderModality,
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
import type { Modality } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

type ModelUxGroupId =
  | 'image-video'
  | 'image-editing'
  | 'video-workflows'
  | 'finish-audio'
  | 'quality'
  | 'advanced';

type HeaderGroupCard =
  | { id: string; type: 'default-video' | 'default-image' }
  | { id: string; type: 'category'; categoryId: ModelCategoryId };

const MODEL_CATEGORY_LABELS = new Map(
  MODEL_CATEGORY_DEFINITIONS.map((category) => [category.id, category.label]),
);

const MODEL_UX_GROUPS: Array<{
  id: ModelUxGroupId;
  label: string;
  description: string;
  categories: ModelCategoryId[];
  cards: HeaderGroupCard[];
}> = [
  {
    id: 'image-video',
    label: 'Image / video',
    description: 'Default generation model picks',
    categories: ['image-to-video', 'text-to-video', 'text-to-image'],
    cards: [
      { id: 'default-video', type: 'default-video' },
      { id: 'default-image', type: 'default-image' },
    ],
  },
  {
    id: 'image-editing',
    label: 'Image editing',
    description: 'Bake and image-manipulation capabilities',
    categories: ['mask-inpaint', 'image-edit', 'multi-image-identity-edit', 'pose-estimation'],
    cards: [
      { id: 'mask-inpaint', type: 'category', categoryId: 'mask-inpaint' },
      { id: 'image-edit', type: 'category', categoryId: 'image-edit' },
      { id: 'multi-image-identity-edit', type: 'category', categoryId: 'multi-image-identity-edit' },
      { id: 'pose-estimation', type: 'category', categoryId: 'pose-estimation' },
    ],
  },
  {
    id: 'video-workflows',
    label: 'Video workflows',
    description: 'Primary generation and sequencing workflows',
    categories: ['image-to-video', 'text-to-video', 'reference-to-video', 'multi-shot'],
    cards: [
      { id: 'image-to-video', type: 'category', categoryId: 'image-to-video' },
      { id: 'text-to-video', type: 'category', categoryId: 'text-to-video' },
      { id: 'reference-to-video', type: 'category', categoryId: 'reference-to-video' },
      { id: 'multi-shot', type: 'category', categoryId: 'multi-shot' },
    ],
  },
  {
    id: 'finish-audio',
    label: 'Finish + audio',
    description: 'Dialogue, voice, and audio finishing tools',
    categories: ['lip-sync', 'text-to-speech', 'voice-cloning', 'video-to-audio', 'audio-separation'],
    cards: [
      { id: 'lip-sync', type: 'category', categoryId: 'lip-sync' },
      { id: 'text-to-speech', type: 'category', categoryId: 'text-to-speech' },
      { id: 'voice-cloning', type: 'category', categoryId: 'voice-cloning' },
      { id: 'video-to-audio', type: 'category', categoryId: 'video-to-audio' },
      { id: 'audio-separation', type: 'category', categoryId: 'audio-separation' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality',
    description: 'Upscaling and motion smoothing',
    categories: ['image-upscale', 'video-upscale', 'frame-interpolation'],
    cards: [
      { id: 'image-upscale', type: 'category', categoryId: 'image-upscale' },
      { id: 'video-upscale', type: 'category', categoryId: 'video-upscale' },
      { id: 'frame-interpolation', type: 'category', categoryId: 'frame-interpolation' },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Compositing, segmentation, control maps, and outpaint',
    categories: [
      'video-matting',
      'video-compositing-inpaint',
      'video-compositing-generative',
      'image-segmentation',
      'video-segmentation',
      'control-reference',
      'depth-estimation',
      'image-outpaint',
      'image-background-removal',
    ],
    cards: [
      { id: 'video-matting', type: 'category', categoryId: 'video-matting' },
      { id: 'video-compositing-inpaint', type: 'category', categoryId: 'video-compositing-inpaint' },
      { id: 'video-compositing-generative', type: 'category', categoryId: 'video-compositing-generative' },
      { id: 'image-segmentation', type: 'category', categoryId: 'image-segmentation' },
      { id: 'video-segmentation', type: 'category', categoryId: 'video-segmentation' },
      { id: 'control-reference', type: 'category', categoryId: 'control-reference' },
      { id: 'depth-estimation', type: 'category', categoryId: 'depth-estimation' },
      { id: 'image-outpaint', type: 'category', categoryId: 'image-outpaint' },
      { id: 'image-background-removal', type: 'category', categoryId: 'image-background-removal' },
    ],
  },
];

function getCategoryModality(categoryId: ModelCategoryId): 'video' | 'image' | 'tts' | 'llm' {
  if (categoryId === 'llm') return 'llm';
  if (categoryId === 'text-to-speech' || categoryId === 'speech-to-text' || categoryId === 'voice-cloning' || categoryId === 'audio-separation') {
    return 'tts';
  }
  if (
    categoryId.includes('video')
    || categoryId === 'lip-sync'
    || categoryId === 'camera-control'
    || categoryId === 'motion-transfer'
    || categoryId === 'multi-shot'
    || categoryId === 'reference-to-video'
    || categoryId === 'frame-interpolation'
  ) {
    return 'video';
  }
  return 'image';
}

function getCategoryBadgeKind(categoryId: ModelCategoryId): 'Video' | 'Image' | 'Audio' | 'LLM' {
  const modality = getCategoryModality(categoryId);
  if (modality === 'video') return 'Video';
  if (modality === 'tts') return 'Audio';
  if (modality === 'llm') return 'LLM';
  return 'Image';
}

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

export function HeaderBar() {
  const ai = useStudioStore((s) => s.ai);
  const projectLocationLabel = useStudioStore((s) => s.projectLocationLabel);
  const projectLocationKind = useStudioStore((s) => s.projectLocationKind);
  const projectSaveState = useStudioStore((s) => s.projectSaveState);
  const fileAccess = useFileSystemAccess();
  const fileApiSupported = fileAccess.supported;
  const saveProjectQuick = useStudioStore((s) => s.saveProjectQuick);
  const openProjectQuick = useStudioStore((s) => s.openProjectQuick);
  const openProjectFolder = useStudioStore((s) => s.openProjectFolder);
  const saveProjectFolderAs = useStudioStore((s) => s.saveProjectFolderAs);
  const newProject = useStudioStore((s) => s.newProject);
  const exportVideo = useStudioStore((s) => s.exportVideo);
  const navigateToPanel = useNavigateToStudioPanel();
  const workspaceView = useStudioStore((s) => s.workspaceView);
  const setModelSlotConfig = useStudioStore((s) => s.setModelSlotConfig);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModelGroupId, setActiveModelGroupId] = useState<ModelUxGroupId>('image-video');
  const [groupMenuOpen, setGroupMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);

  const videoDisplay = getSelectedVideoModelDisplay(ai);
  const imageDisplay = getSelectedImageModelDisplay(ai);
  const isCustomVideo = isCustomProvider(ai.defaultVideoProvider, ai);
  const isCustomImage = isCustomProvider(ai.defaultImageProvider, ai);
  const videoConnected = isProviderConnected(ai.defaultVideoProvider, isCustomVideo, ai);
  const imageConnected = isProviderConnected(ai.defaultImageProvider, isCustomImage, ai);
  const videoStatus = getProviderStatus(ai.defaultVideoProvider, isCustomVideo, ai);
  const imageStatus = getProviderStatus(ai.defaultImageProvider, isCustomImage, ai);
  const activeModelGroup = MODEL_UX_GROUPS.find((group) => group.id === activeModelGroupId) ?? MODEL_UX_GROUPS[0];
  const groupCards = activeModelGroup.cards;

  useEffect(() => {
    if (!groupMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!groupMenuRef.current?.contains(event.target as Node)) {
        setGroupMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setGroupMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [groupMenuOpen]);

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
  const folderStatus = folderStatusCopy(projectLocationKind, projectSaveState, fileAccess);
  const hasDirectory = projectLocationKind === 'directory';
  const directoryApiSupported = fileAccess.tier === 'directory';
  const nativeFileApiSupported = fileAccess.tier === 'directory' || fileAccess.tier === 'file-only';

  return (
    <header
      className="border-b border-surface-700 min-h-16 py-2 flex items-center justify-between px-[15px] z-50"
      {...uiSectionProps(UI_SECTIONS.studioHeader)}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex flex-col gap-1 flex-shrink-0" {...uiSectionProps(UI_SECTIONS.studioHeaderBrand)}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateToPanel('app-summary')}
              className={`flex items-center gap-1.5 rounded-md px-1 py-0.5 -ml-1 transition-colors ${
                workspaceView === 'app-summary'
                  ? 'bg-brand-600/15 ring-1 ring-brand-500/30'
                  : 'hover:bg-surface-800/80'
              }`}
              title="VideoGen apps"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <Video className="w-3 h-3 text-white" aria-hidden />
              </div>
              <span className="font-semibold text-xs text-gray-200">VideoGen</span>
            </button>
            <SplitButton
              compact
              label={getStudioPanelTitle(workspaceView)}
              primaryAction="toggle-menu"
              menuAction="toggle-menu"
              renderMenu={(closeMenu) => <AppsLauncherMenu onDismiss={closeMenu} />}
              primaryUiSection={uiSectionProps(UI_SECTIONS.studioHeaderAppsSplit)}
              menuUiSection={uiSectionProps(UI_SECTIONS.studioHeaderAppsMenu)}
            />
          </div>
          <StudioLauncherIconBar />
        </div>

        <div className="h-8 w-px bg-surface-600 hidden md:block flex-shrink-0 self-center" />

        <HeaderLegendContainer legend="Project">
          <div className="flex items-center gap-2 flex-shrink-0">
            <ProjectSwitcherDropdown />

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                className="px-2 py-1.5 text-xs bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-lg transition-all"
                title="Project folder and actions"
              >
                <svg
                  className={`w-3.5 h-3.5 ${folderStatus.urgent ? 'text-amber-400' : 'text-gray-300'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 py-2 text-sm">
                  <div className="px-3 pb-2">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${folderStatus.dotClass}`} />
                      <div className="min-w-0">
                        <div className="font-medium text-gray-200">{folderStatus.headline}</div>
                        {hasDirectory && projectLocationLabel ? (
                          <div className="text-xs text-gray-400 truncate mt-0.5">{projectLocationLabel}</div>
                        ) : (
                          <div className="text-xs text-gray-500 leading-relaxed mt-0.5">{folderStatus.detail}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  {fileApiSupported && (
                    <div className="px-3 pb-2 flex flex-col gap-1.5">
                      {!hasDirectory ? (
                        <>
                          {directoryApiSupported ? (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
                              onClick={() => { void saveProjectFolderAs(); setMenuOpen(false); }}
                            >
                              Choose project folder…
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
                              onClick={() => { void saveProjectQuick(); setMenuOpen(false); }}
                            >
                              {nativeFileApiSupported ? 'Save JSON file…' : 'Download project JSON…'}
                            </button>
                          )}
                          {directoryApiSupported ? (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-gray-300 transition-colors"
                              onClick={() => { void openProjectFolder(); setMenuOpen(false); }}
                            >
                              Open existing project folder…
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          {projectSaveState === 'dirty' && (
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
                              onClick={() => { void saveProjectQuick(); setMenuOpen(false); }}
                            >
                              Save now
                            </button>
                          )}
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-gray-300 transition-colors"
                            onClick={() => { void openProjectFolder(); setMenuOpen(false); }}
                          >
                            Open different folder…
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-gray-300 transition-colors"
                            onClick={() => { void saveProjectFolderAs(); setMenuOpen(false); }}
                          >
                            Save copy to new folder…
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <div className="h-px bg-surface-600 my-1" />
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
          </div>
        </HeaderLegendContainer>

        <div className="h-8 w-px bg-surface-600 hidden md:block flex-shrink-0" />

        <div
          className="hidden sm:flex items-center min-w-0 ml-1"
          {...uiSectionProps(UI_SECTIONS.studioHeaderProviderBadge)}
        >
          <HeaderLegendContainer legend="Models">
            <div ref={groupMenuRef} className="relative min-w-[15rem] self-stretch">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={groupMenuOpen}
                onClick={() => setGroupMenuOpen((value) => !value)}
                className="w-full h-full min-w-0 flex items-center px-2 py-1 rounded-md border border-surface-600 bg-surface-800/60 hover:bg-surface-700/80 transition-colors text-left"
                title="Choose a model workflow group"
              >
                <div className="min-w-0 leading-tight flex-1">
                  <div className="text-[9px] uppercase tracking-wider text-gray-500">Group</div>
                  <div className="text-[11px] font-medium text-gray-200 truncate">{activeModelGroup.label}</div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {groupCards.length} cards
                  </div>
                </div>
                <span className="text-gray-500 text-[10px] flex-shrink-0 pl-1" aria-hidden>▾</span>
              </button>
              {groupMenuOpen && (
                <div
                  role="menu"
                  className="absolute top-full left-0 mt-1 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-[60] w-[42rem] max-w-[90vw] max-h-[70vh] overflow-y-auto p-4"
                >
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500">Model workflow groups</div>
                    <div className="text-xs text-gray-400 mt-1">Choose the group shown in the header model badges.</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {MODEL_UX_GROUPS.map((group) => {
                      const isActive = group.id === activeModelGroup.id;
                      const icon = group.id === 'image-editing'
                        ? ImageIcon
                        : group.id === 'video-workflows'
                          ? Clapperboard
                          : group.id === 'finish-audio'
                            ? Library
                            : group.id === 'quality'
                              ? Palette
                              : group.id === 'advanced'
                                ? Settings
                                : Users;
                      const Icon = icon;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={isActive}
                          onClick={() => {
                            setActiveModelGroupId(group.id);
                            setGroupMenuOpen(false);
                          }}
                          className={`text-left rounded-lg border p-2.5 transition-colors h-full min-h-[9rem] flex flex-col ${
                            isActive
                              ? 'border-brand-500/50 bg-brand-500/15'
                              : 'border-surface-600 bg-surface-900/50 hover:bg-surface-700/70'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex w-5 h-5 rounded-md items-center justify-center ${
                              isActive ? 'bg-brand-500/30 text-brand-200' : 'bg-surface-700 text-gray-300'
                            }`}>
                              <Icon className="w-3 h-3" aria-hidden />
                            </span>
                            <span className="text-xs font-medium text-gray-100 truncate flex-1">{group.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-surface-600 bg-surface-800 text-gray-300">
                              {group.cards.length}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 leading-snug">{group.description}</div>
                          <div className="text-[10px] text-gray-500 leading-snug mt-2">
                            {group.categories.map((categoryId) => MODEL_CATEGORY_LABELS.get(categoryId) ?? categoryId).join(', ')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="self-stretch w-[39rem] max-w-[39rem] overflow-hidden rounded-md border border-surface-700 bg-surface-900/30 p-1">
              <div className="flex gap-2 min-h-[53px] overflow-x-auto overflow-y-hidden pr-1 pb-1">
                {groupCards.map((card, index) => {
                  if (card.type === 'default-video') {
                    return (
                      <div key={card.id} className="w-[12.25rem] h-[53px] flex-shrink-0">
                        <ProviderBadge
                          fill
                          kind="Video"
                          providerId={isCustomVideo ? undefined : ai.defaultVideoProvider}
                          fallbackIcon={isCustomVideo ? '🛠️' : getBuiltInProvider(ai.defaultVideoProvider)?.icon ?? '🔌'}
                          providerName={videoDisplay.providerName}
                          modelLabel={videoDisplay.modelLabel}
                          connected={videoConnected}
                          status={videoStatus}
                          sectionId={UI_SECTIONS.studioHeaderVideoProviderBadge.id}
                        />
                      </div>
                    );
                  }
                  if (card.type === 'default-image') {
                    return (
                      <div key={card.id} className="w-[12.25rem] h-[53px] flex-shrink-0">
                        <ProviderBadge
                          fill
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
                    );
                  }

                  if (card.type !== 'category') return null;
                  const slot = ai.modelSlots?.[card.categoryId];
                  if (!slot) return null;

                  const slotIsCustom = isCustomProvider(slot.providerId, ai);
                  const slotConnected = isProviderConnected(slot.providerId, slotIsCustom, ai);
                  const slotStatus = getProviderStatus(slot.providerId, slotIsCustom, ai);
                  const slotProviderName = getBuiltInProvider(slot.providerId)?.name ?? slot.providerId;
                  const slotBadgeKind = getCategoryBadgeKind(card.categoryId);
                  const slotModality = getCategoryModality(card.categoryId);

                  return (
                    <div key={card.id} className="w-[12.25rem] h-[53px] flex-shrink-0">
                      <ProviderBadge
                        fill
                        kind={slotBadgeKind}
                        label={MODEL_CATEGORY_LABELS.get(card.categoryId) ?? card.categoryId}
                        modalityOverride={slotModality}
                        providerId={slotIsCustom ? undefined : slot.providerId}
                        fallbackIcon={slotIsCustom ? '🛠️' : getBuiltInProvider(slot.providerId)?.icon ?? '🔌'}
                        providerName={slotProviderName}
                        modelLabel={slot.modelId}
                        connected={slotConnected}
                        status={slotStatus}
                        selectedProviderId={slot.providerId}
                        selectedModelId={slot.modelId}
                        onProviderSelect={(providerId) => {
                          const providerIsCustom = isCustomProvider(providerId, ai);
                          const nextModelId = resolveModelSelectionForProviderModality(
                            providerId,
                            providerIsCustom,
                            ai,
                            slotModality as Modality,
                            slot.modelId,
                          );
                          setModelSlotConfig(card.categoryId, {
                            providerId,
                            ...(nextModelId ? { modelId: nextModelId } : {}),
                          });
                        }}
                        onModelSelect={(modelId) => {
                          setModelSlotConfig(card.categoryId, { modelId });
                        }}
                        sectionId={`${UI_SECTIONS.studioHeaderProviderBadge.id}-${card.categoryId}-${index}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </HeaderLegendContainer>
        </div>
      </div>
    </header>
  );
}