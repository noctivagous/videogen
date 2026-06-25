'use client';

import { useEffect, useState } from 'react';
import { ManagedModal } from '@/components/ui/ModalManager';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { BUILTIN_DEMO_PROJECT_ID } from '@/lib/storage/saved-projects-store';
import { useStudioStore } from '@/store/useStudioStore';

export function ProjectSettingsModal() {
  const projectSettingsOpen = useStudioStore((s) => s.projectSettingsOpen);
  const projectSettingsProjectId = useStudioStore((s) => s.projectSettingsProjectId);
  const savedProjects = useStudioStore((s) => s.savedProjects);
  const activeProjectId = useStudioStore((s) => s.activeProjectId);
  const projectName = useStudioStore((s) => s.project.name);
  const closeProjectSettings = useStudioStore((s) => s.closeProjectSettings);
  const renameSavedProject = useStudioStore((s) => s.renameSavedProject);
  const deleteSavedProject = useStudioStore((s) => s.deleteSavedProject);

  const targetName = projectSettingsProjectId === activeProjectId
    ? projectName
    : savedProjects.find((entry) => entry.id === projectSettingsProjectId)?.name ?? '';

  const isDemoProject = projectSettingsProjectId === BUILTIN_DEMO_PROJECT_ID;

  const [name, setName] = useState(targetName);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (projectSettingsOpen) {
      setName(targetName);
      setConfirmDelete(false);
    }
  }, [projectSettingsOpen, targetName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || !projectSettingsProjectId) return;
    setSaving(true);
    try {
      await renameSavedProject(projectSettingsProjectId, trimmed);
      closeProjectSettings();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!projectSettingsProjectId) return;
    setDeleting(true);
    try {
      await deleteSavedProject(projectSettingsProjectId);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ManagedModal
      open={projectSettingsOpen}
      onClose={closeProjectSettings}
      className="glass w-full max-w-md rounded-2xl border border-surface-700 overflow-hidden flex flex-col modal"
      role="dialog"
      aria-modal="true"
      aria-label="Project settings"
      {...uiSectionProps(UI_SECTIONS.studioProjectSettingsModal)}
    >
      <div className="px-5 py-4 border-b border-surface-700 flex items-center justify-between gap-3 flex-shrink-0">
        <div>
          <div className="font-semibold text-lg text-gray-100">Project Settings</div>
          <div className="text-xs text-gray-400 mt-0.5">Rename and manage this project</div>
        </div>
        <button
          type="button"
          onClick={closeProjectSettings}
          className="p-2 hover:bg-surface-700 rounded-lg transition-all text-gray-400 hover:text-white shrink-0"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label
            htmlFor="project-settings-name"
            className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5"
          >
            Project name
          </label>
          <input
            id="project-settings-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSave();
            }}
            className="w-full bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all text-gray-100"
            autoFocus
          />
        </div>

        {!isDemoProject ? (
          <div className="pt-4 border-t border-surface-700">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              Delete project
            </div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors"
              >
                Delete project…
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-gray-200 leading-snug">
                  Delete <span className="font-medium text-white">{targetName || 'this project'}</span>?
                  This removes it from your saved projects list. Files already saved on disk are not deleted.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-surface-700 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="px-5 py-4 border-t border-surface-700 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={closeProjectSettings}
          className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-surface-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!name.trim() || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </ManagedModal>
  );
}
