'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  BUILTIN_DEMO_PROJECT_ID,
  type SavedProjectSummary,
} from '@/lib/storage/saved-projects-store';
import { useStudioStore } from '@/store/useStudioStore';

function ProjectMenuItem({
  entry,
  active,
  onSelect,
}: {
  entry: SavedProjectSummary;
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

export function ProjectSwitcherDropdown() {
  const projectName = useStudioStore((s) => s.project.name);
  const savedProjects = useStudioStore((s) => s.savedProjects);
  const activeProjectId = useStudioStore((s) => s.activeProjectId);
  const switchToSavedProject = useStudioStore((s) => s.switchToSavedProject);
  const newProject = useStudioStore((s) => s.newProject);
  const resetDemoToDefaults = useStudioStore((s) => s.resetDemoToDefaults);

  const userProjects = savedProjects.filter((entry) => entry.id !== BUILTIN_DEMO_PROJECT_ID);
  const demoProject = savedProjects.find((entry) => entry.id === BUILTIN_DEMO_PROJECT_ID);

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

  const handleSelect = (entry: SavedProjectSummary) => {
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
          className="absolute top-full left-0 mt-1 w-52 md:w-60 max-h-72 overflow-y-auto bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 py-1 text-sm"
        >
          {userProjects.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-xs">No saved projects yet</div>
          ) : (
            userProjects.map((entry) => (
              <ProjectMenuItem
                key={entry.id}
                entry={entry}
                active={entry.id === activeProjectId}
                onSelect={() => handleSelect(entry)}
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
                onSelect={() => handleSelect(demoProject)}
              />
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 pb-2 pt-0 text-xs text-gray-500 hover:text-gray-300 hover:bg-surface-700/60 transition-colors"
                onClick={handleResetDemo}
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
            onClick={handleNewProject}
          >
            New Project
          </button>
        </div>
      )}
    </div>
  );
}
