'use client';

import { useEffect, useState } from 'react';
import { BackdropFramingLockToggle } from '@/components/studio/BackdropFramingLockToggle';
import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import { BUILTIN_DEMO_PROJECT_ID } from '@/lib/storage/saved-projects-store';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

export function SettingsProjectContent() {
  const project = useStudioStore((s) => s.project);
  const setProject = useStudioStore((s) => s.setProject);
  const activeProjectId = useStudioStore((s) => s.activeProjectId);
  const renameSavedProject = useStudioStore((s) => s.renameSavedProject);

  const [name, setName] = useState(project.name);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setName(project.name);
  }, [project.name]);

  const presets = RESOLUTION_PRESETS[project.aspectRatio as AspectRatio] || RESOLUTION_PRESETS['16:9'];
  const isDemoProject = activeProjectId === BUILTIN_DEMO_PROJECT_ID;

  const handleNameSave = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name || !activeProjectId) return;
    setSavingName(true);
    try {
      await renameSavedProject(activeProjectId, trimmed);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-6 border border-surface-700 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Project</h2>
          <p className="text-sm text-gray-400 mt-1">Name and metadata for the active project.</p>
        </div>

        <div>
          <label
            htmlFor="settings-project-name"
            className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5"
          >
            Project name
          </label>
          <div className="flex items-center gap-2">
            <input
              id="settings-project-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleNameSave();
              }}
              disabled={isDemoProject}
              className="flex-1 bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all text-gray-100 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleNameSave()}
              disabled={isDemoProject || !name.trim() || name.trim() === project.name || savingName}
              className="px-4 py-3 rounded-xl text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
          {isDemoProject ? (
            <p className="text-xs text-gray-500 mt-2">The demo project name cannot be changed.</p>
          ) : null}
        </div>
      </div>

      <div className="glass rounded-3xl p-6 border border-surface-700 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Output defaults</h2>
          <p className="text-sm text-gray-400 mt-1">Aspect ratio, resolution, frame rate, and clip length.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <BackdropFramingLockToggle />

          <div className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700">
            <select
              value={project.aspectRatio}
              onChange={(event) => setProject({ aspectRatio: event.target.value as AspectRatio })}
              className="bg-transparent text-sm outline-none select-arrow appearance-none pr-8 cursor-pointer"
              aria-label="Aspect ratio"
            >
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Portrait</option>
              <option value="1:1">1:1 Square</option>
              <option value="4:3">4:3 Classic</option>
              <option value="21:9">21:9 Ultra-wide</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700">
            <select
              value={project.resolution}
              onChange={(event) => setProject({ resolution: event.target.value })}
              className="bg-transparent text-sm outline-none select-arrow appearance-none pr-8 cursor-pointer"
              aria-label="Resolution"
            >
              {presets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label} ({preset.value})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700">
            <select
              value={project.fps}
              onChange={(event) => setProject({ fps: parseInt(event.target.value, 10) })}
              className="bg-transparent text-sm outline-none select-arrow appearance-none pr-8 cursor-pointer"
              aria-label="Frames per second"
            >
              <option value={24}>24 FPS</option>
              <option value={30}>30 FPS</option>
              <option value={60}>60 FPS</option>
              <option value={120}>120 FPS</option>
            </select>
          </div>

          <div
            className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700"
            title="Output clip length for Generate"
          >
            <input
              type="number"
              value={project.duration}
              min={1}
              max={60}
              onChange={(event) => setProject({ duration: parseInt(event.target.value, 10) || 5 })}
              className="bg-transparent text-sm w-12 outline-none"
              aria-label="Clip duration in seconds"
            />
            <span className="text-sm text-gray-400">sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}