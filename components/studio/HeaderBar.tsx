'use client';

import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import { getCurrentProviderName } from '@/lib/storage/ai-settings';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

export function HeaderBar() {
  const project = useStudioStore((s) => s.project);
  const ai = useStudioStore((s) => s.ai);
  const setProject = useStudioStore((s) => s.setProject);
  const saveProject = useStudioStore((s) => s.saveProject);
  const loadProject = useStudioStore((s) => s.loadProject);
  const exportVideo = useStudioStore((s) => s.exportVideo);
  const openSettings = useStudioStore((s) => s.openSettings);

  const presets = RESOLUTION_PRESETS[project.aspectRatio as AspectRatio] || RESOLUTION_PRESETS['16:9'];
  const providerName = getCurrentProviderName(ai);

  return (
    <header className="glass border-b border-surface-700 h-16 flex items-center justify-between px-4 md:px-6 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-lg hidden sm:block">VideoGen</span>
        </div>

        <div className="h-8 w-px bg-surface-600 hidden md:block" />

        <input
          type="text"
          value={project.name}
          onChange={(e) => setProject({ name: e.target.value })}
          className="bg-surface-700 hover:bg-surface-600 focus:bg-surface-600 border-surface-600 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 transition-all w-32 md:w-48"
        />

        <button
          type="button"
          onClick={openSettings}
          className="hidden md:flex items-center gap-2 ml-2 px-3 py-1 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-lg cursor-pointer transition-all text-xs"
          title="Click to manage AI providers & models"
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="font-medium text-gray-300">{providerName}</span>
          </div>
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700">
          <select
            value={project.aspectRatio}
            onChange={(e) => setProject({ aspectRatio: e.target.value as AspectRatio })}
            className="bg-transparent text-sm outline-none select-arrow appearance-none pr-8 cursor-pointer"
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
            onChange={(e) => setProject({ resolution: e.target.value })}
            className="bg-transparent text-sm outline-none select-arrow appearance-none pr-8 cursor-pointer"
          >
            {presets.map((p) => (
              <option key={p.value} value={p.value}>{p.label} ({p.value})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700">
          <select
            value={project.fps}
            onChange={(e) => setProject({ fps: parseInt(e.target.value) })}
            className="bg-transparent text-sm outline-none select-arrow appearance-none pr-8 cursor-pointer"
          >
            <option value={24}>24 FPS</option>
            <option value={30}>30 FPS</option>
            <option value={60}>60 FPS</option>
            <option value={120}>120 FPS</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700">
          <input
            type="number"
            value={project.duration}
            min={1}
            max={60}
            onChange={(e) => setProject({ duration: parseInt(e.target.value) || 5 })}
            className="bg-transparent text-sm w-12 outline-none"
          />
          <span className="text-sm text-gray-400">sec</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={saveProject} className="p-2 hover:bg-surface-700 rounded-lg transition-all group">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>
        <button type="button" onClick={() => loadProject()} className="p-2 hover:bg-surface-700 rounded-lg transition-all group">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={exportVideo}
          className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-500 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </button>
        <button
          type="button"
          onClick={openSettings}
          className="p-2 hover:bg-surface-700 rounded-lg transition-all group border border-surface-600 hover:border-surface-500"
          title="AI Providers, Models & API Keys"
        >
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.572 1.065c1.755.426 1.755 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.572-1.065c-1.755-.426-1.755-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}