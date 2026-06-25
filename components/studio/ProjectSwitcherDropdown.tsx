'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getLiveProjectThumbnailUrl } from '@/lib/studio/project-thumbnail';
import {
  formatProjectDiskSize,
  getLiveProjectStats,
  PROJECT_SUMMARY_STAT_LABELS,
} from '@/lib/studio/project-summary-stats';
import {
  BUILTIN_DEMO_PROJECT_ID,
  type SavedProjectSummary,
} from '@/lib/storage/saved-projects-store';
import { useStudioStore } from '@/store/useStudioStore';

export type ProjectSwitcherMenuView = 'grid' | 'list';

type ProjectEntry = SavedProjectSummary & {
  thumbnailUrl?: string | null;
};

function ProjectMenuItem({
  entry,
  active,
  onSelect,
}: {
  entry: ProjectEntry;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`w-full text-left px-3 py-2 hover:bg-surface-700 transition-colors ${
        active ? 'bg-surface-700/70 text-white' : 'text-gray-200'
      }`}
      onClick={onSelect}
    >
      <div className="truncate font-medium">{entry.name}</div>
      {entry.locationLabel ? (
        <div className="truncate text-[10px] text-gray-500 mt-0.5">{entry.locationLabel}</div>
      ) : null}
    </button>
  );
}

function ProjectStatChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="px-1.5 py-0.5 rounded-md bg-surface-800/90 border border-surface-600 text-[9px] font-medium text-gray-300 whitespace-nowrap">
      {label}:{count}
    </span>
  );
}

function ProjectThumbnailPlaceholder({ stats }: { stats: ProjectEntry['stats'] }) {
  return (
    <div className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-1.5 p-3 bg-surface-900">
      {PROJECT_SUMMARY_STAT_LABELS.map(({ key, label }) => (
        <ProjectStatChip key={key} label={label} count={stats[key]} />
      ))}
    </div>
  );
}

function ProjectGridCard({
  entry,
  active,
  onSelect,
  onOpenSettings,
  onExport,
}: {
  entry: ProjectEntry;
  active: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-surface-800/60 hover:border-brand-500/40 hover:bg-surface-800 overflow-hidden transition-colors ${
        active ? 'border-brand-500/50 ring-1 ring-brand-500/30' : 'border-surface-700'
      }`}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onSelect}
        className="w-full text-left"
      >
        <div className="aspect-video bg-surface-900 relative">
          {entry.thumbnailUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                {PROJECT_SUMMARY_STAT_LABELS.map(({ key, label }) => (
                  <ProjectStatChip key={key} label={label} count={entry.stats[key]} />
                ))}
              </div>
            </>
          ) : (
            <ProjectThumbnailPlaceholder stats={entry.stats} />
          )}
        </div>
        <div className="p-3 pb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-100 truncate">{entry.name}</div>
            {entry.locationLabel ? (
              <div className="text-[10px] text-gray-500 truncate mt-1">{entry.locationLabel}</div>
            ) : null}
          </div>
          <div
            className="text-[10px] text-gray-500 flex-shrink-0 tabular-nums pt-0.5"
            title="Estimated project size"
          >
            {formatProjectDiskSize(entry.stats.diskBytes)}
          </div>
        </div>
      </button>
      <div className="px-3 pb-3 pt-0 flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenSettings();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-gray-200 hover:bg-surface-700 transition-colors"
          title="Project settings"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.572 1.065c1.755.426 1.755 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.572-1.065c-1.755-.426-1.755-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onExport();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-gray-400 hover:text-gray-200 hover:bg-surface-700 transition-colors"
          title="Export project JSON"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
    </div>
  );
}

function ProjectSwitcherListMenu({
  userProjects,
  demoProject,
  activeProjectId,
  onSelect,
  onResetDemo,
  onNewProject,
}: {
  userProjects: ProjectEntry[];
  demoProject: ProjectEntry | undefined;
  activeProjectId: string | null;
  onSelect: (entry: ProjectEntry) => void;
  onResetDemo: () => void;
  onNewProject: () => void;
}) {
  return (
    <>
      {userProjects.length === 0 ? (
        <div className="px-3 py-2 text-gray-500 text-xs">No saved projects yet</div>
      ) : (
        userProjects.map((entry) => (
          <ProjectMenuItem
            key={entry.id}
            entry={entry}
            active={entry.id === activeProjectId}
            onSelect={() => onSelect(entry)}
          />
        ))
      )}

      {demoProject ? (
        <>
          <div className="h-px bg-surface-600 my-1" role="separator" />
          <div
            className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-gray-500"
            aria-hidden
          >
            Demo
          </div>
          <ProjectMenuItem
            entry={demoProject}
            active={demoProject.id === activeProjectId}
            onSelect={() => onSelect(demoProject)}
          />
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 pb-2 pt-0 text-xs text-gray-500 hover:text-gray-300 hover:bg-surface-700/60 transition-colors"
            onClick={onResetDemo}
          >
            Reset to defaults
          </button>
        </>
      ) : null}

      <div className="h-px bg-surface-600 my-1" role="separator" />
      <button
        type="button"
        role="menuitem"
        className="w-full text-left px-3 py-2 hover:bg-surface-700 text-gray-200 transition-colors"
        onClick={onNewProject}
      >
        New Project
      </button>
    </>
  );
}

function ProjectSwitcherGridMenu({
  userProjects,
  demoProject,
  activeProjectId,
  onSelect,
  onOpenSettings,
  onExport,
  onResetDemo,
  onNewProject,
}: {
  userProjects: ProjectEntry[];
  demoProject: ProjectEntry | undefined;
  activeProjectId: string | null;
  onSelect: (entry: ProjectEntry) => void;
  onOpenSettings: (entry: ProjectEntry) => void;
  onExport: (entry: ProjectEntry) => void;
  onResetDemo: () => void;
  onNewProject: () => void;
}) {
  return (
    <>
      <div className="max-h-72 overflow-y-auto p-4">
        {userProjects.length === 0 ? (
          <div className="text-gray-500 text-xs px-1 py-2">No saved projects yet</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userProjects.map((entry) => (
              <ProjectGridCard
                key={entry.id}
                entry={entry}
                active={entry.id === activeProjectId}
                onSelect={() => onSelect(entry)}
                onOpenSettings={() => onOpenSettings(entry)}
                onExport={() => onExport(entry)}
              />
            ))}
          </div>
        )}

        {demoProject ? (
          <>
            <div className="h-px bg-surface-600 my-4" role="separator" />
            <div
              className="px-1 pb-2 text-[10px] uppercase tracking-wider text-gray-500"
              aria-hidden
            >
              Demo
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProjectGridCard
                entry={demoProject}
                active={demoProject.id === activeProjectId}
                onSelect={() => onSelect(demoProject)}
                onOpenSettings={() => onOpenSettings(demoProject)}
                onExport={() => onExport(demoProject)}
              />
            </div>
            <button
              type="button"
              role="menuitem"
              className="mt-2 px-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              onClick={onResetDemo}
            >
              Reset to defaults
            </button>
          </>
        ) : null}
      </div>

      <div className="border-t border-surface-600 px-4 py-3">
        <button
          type="button"
          role="menuitem"
          className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-gray-200 transition-colors text-sm font-medium"
          onClick={onNewProject}
        >
          New Project
        </button>
      </div>
    </>
  );
}

export function ProjectSwitcherDropdown({
  menuView = 'grid',
}: {
  menuView?: ProjectSwitcherMenuView;
}) {
  const projectName = useStudioStore((s) => s.project.name);
  const project = useStudioStore((s) => s.project);
  const scenes = useStudioStore((s) => s.scenes);
  const currentSceneId = useStudioStore((s) => s.currentSceneId);
  const characters = useStudioStore((s) => s.characters);
  const locations = useStudioStore((s) => s.locations);
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const shotWorkflowSnapshots = useStudioStore((s) => s.shotWorkflowSnapshots);
  const savedProjects = useStudioStore((s) => s.savedProjects);
  const activeProjectId = useStudioStore((s) => s.activeProjectId);
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const switchToSavedProject = useStudioStore((s) => s.switchToSavedProject);
  const newProject = useStudioStore((s) => s.newProject);
  const resetDemoToDefaults = useStudioStore((s) => s.resetDemoToDefaults);
  const openProjectSettings = useStudioStore((s) => s.openProjectSettings);
  const exportSavedProject = useStudioStore((s) => s.exportSavedProject);

  const liveThumbnail = useMemo(
    () => getLiveProjectThumbnailUrl({
      setups,
      currentSetupId,
      currentCoverageShotId,
      globalMediaLibrary,
    }),
    [setups, currentSetupId, currentCoverageShotId, globalMediaLibrary],
  );

  const liveStats = useMemo(
    () => getLiveProjectStats({
      project,
      scenes,
      currentSceneId,
      setups,
      currentSetupId,
      currentCoverageShotId,
      characters,
      locations,
      mediaLibrary,
      shotWorkflowSnapshots,
      globalMediaLibrary,
    }),
    [
      project,
      scenes,
      currentSceneId,
      setups,
      currentSetupId,
      currentCoverageShotId,
      characters,
      locations,
      mediaLibrary,
      shotWorkflowSnapshots,
      globalMediaLibrary,
    ],
  );

  const withLiveData = (entry: SavedProjectSummary): ProjectEntry => ({
    ...entry,
    thumbnailUrl: entry.id === activeProjectId
      ? (liveThumbnail ?? entry.thumbnailUrl)
      : entry.thumbnailUrl,
    stats: entry.id === activeProjectId ? liveStats : entry.stats,
  });

  const userProjects = savedProjects
    .filter((entry) => entry.id !== BUILTIN_DEMO_PROJECT_ID)
    .map(withLiveData);
  const demoProject = savedProjects
    .find((entry) => entry.id === BUILTIN_DEMO_PROJECT_ID);
  const demoProjectEntry = demoProject ? withLiveData(demoProject) : undefined;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleSelect = (entry: ProjectEntry) => {
    if (entry.id === activeProjectId) {
      setOpen(false);
      return;
    }
    void switchToSavedProject(entry.id).finally(() => setOpen(false));
  };

  const handleNewProject = () => {
    newProject();
    setOpen(false);
  };

  const handleResetDemo = () => {
    resetDemoToDefaults();
    setOpen(false);
  };

  const handleOpenSettings = (entry: ProjectEntry) => {
    setOpen(false);
    openProjectSettings(entry.id);
  };

  const handleExport = (entry: ProjectEntry) => {
    void exportSavedProject(entry.id);
  };

  const menuProps = {
    userProjects,
    demoProject: demoProjectEntry,
    activeProjectId,
    onSelect: handleSelect,
    onOpenSettings: handleOpenSettings,
    onExport: handleExport,
    onResetDemo: handleResetDemo,
    onNewProject: handleNewProject,
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 bg-surface-700 hover:bg-surface-600 focus:bg-surface-600 border border-surface-600 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 transition-all w-28 md:w-44 text-left"
        title="Switch project"
        {...uiSectionProps(UI_SECTIONS.studioHeaderProjectName)}
      >
        <span className="truncate flex-1">{projectName}</span>
        <span className="text-gray-500 text-[10px] flex-shrink-0" aria-hidden>▾</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Saved projects"
          className={`absolute top-full left-0 mt-1 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 text-sm ${
            menuView === 'grid'
              ? 'w-[32rem] max-w-[90vw] flex flex-col overflow-hidden'
              : 'w-52 md:w-60 max-h-72 overflow-y-auto py-1'
          }`}
        >
          {menuView === 'grid' ? (
            <ProjectSwitcherGridMenu {...menuProps} />
          ) : (
            <ProjectSwitcherListMenu {...menuProps} />
          )}
        </div>
      )}
    </div>
  );
}
