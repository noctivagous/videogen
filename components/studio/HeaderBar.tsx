'use client';

import { useRef, useState } from 'react';
import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  getProviderStatus,
  getSelectedImageModelDisplay,
  getSelectedVideoModelDisplay,
} from '@/lib/studio/provider-modalities';
import { isCustomProvider, isProviderConnected } from '@/lib/storage/ai-settings';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

function ProviderBadge({
  kind,
  providerName,
  modelLabel,
  connected,
  status,
  sectionId,
}: {
  kind: 'Video' | 'Image';
  providerName: string;
  modelLabel: string | null;
  connected: boolean;
  status: ReturnType<typeof getProviderStatus>;
  sectionId: string;
}) {
  const openSettings = useStudioStore((s) => s.openSettings);

  return (
    <button
      type="button"
      onClick={openSettings}
      className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-lg cursor-pointer transition-all text-xs max-w-[200px] lg:max-w-[220px]"
      title={`${kind} provider & model — click to manage`}
      id={sectionId}
      data-ui-section={sectionId}
      data-ui-section-name={`${kind} Provider Badge`}
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === 'verified'
          ? 'bg-emerald-400'
          : status === 'configured' || status === 'failed'
            ? 'bg-amber-500'
            : 'bg-gray-500'
      }`} />
      <div className="min-w-0 text-left leading-tight">
        <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">{kind}</div>
        <div className="font-medium text-gray-300 truncate">{providerName}</div>
        <div className="text-[10px] text-gray-500 truncate">
          {!connected
            ? 'Setup required'
            : modelLabel
              ? `${modelLabel}${status === 'configured' ? ' · unverified' : ''}`
              : status === 'configured'
                ? 'Unverified'
                : 'No model selected'}
        </div>
      </div>
    </button>
  );
}

export function HeaderBar() {
  const project = useStudioStore((s) => s.project);
  const ai = useStudioStore((s) => s.ai);
  const setProject = useStudioStore((s) => s.setProject);
  const saveProject = useStudioStore((s) => s.saveProject);
  const loadProject = useStudioStore((s) => s.loadProject);
  const newProject = useStudioStore((s) => s.newProject);
  const resetToDemo = useStudioStore((s) => s.resetToDemo);
  const exportVideo = useStudioStore((s) => s.exportVideo);
  const openSettings = useStudioStore((s) => s.openSettings);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const presets = RESOLUTION_PRESETS[project.aspectRatio as AspectRatio] || RESOLUTION_PRESETS['16:9'];
  const videoDisplay = getSelectedVideoModelDisplay(ai);
  const imageDisplay = getSelectedImageModelDisplay(ai);
  const isCustomVideo = isCustomProvider(ai.defaultVideoProvider, ai);
  const isCustomImage = isCustomProvider(ai.defaultImageProvider, ai);
  const videoConnected = isProviderConnected(ai.defaultVideoProvider, isCustomVideo, ai);
  const imageConnected = isProviderConnected(ai.defaultImageProvider, isCustomImage, ai);
  const videoStatus = getProviderStatus(ai.defaultVideoProvider, isCustomVideo, ai);
  const imageStatus = getProviderStatus(ai.defaultImageProvider, isCustomImage, ai);

  return (
    <header
      className="glass border-b border-surface-700 h-16 flex items-center justify-between px-4 md:px-6 z-50"
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

        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-[10px] uppercase tracking-wider text-gray-500 hidden sm:block">Project</label>
          <input
            type="text"
            value={project.name}
            onChange={(e) => setProject({ name: e.target.value })}
            className="bg-surface-700 hover:bg-surface-600 focus:bg-surface-600 border-surface-600 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500 transition-all w-28 md:w-44"
            aria-label="Project name"
            {...uiSectionProps(UI_SECTIONS.studioHeaderProjectName)}
          />

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
              <div className="absolute top-full left-0 mt-1 w-44 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-50 py-1 text-sm">
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { newProject(); setMenuOpen(false); }}>New project</button>
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { resetToDemo(); setMenuOpen(false); }}>Reset to demo</button>
                <div className="h-px bg-surface-600 my-1" />
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { saveProject(); setMenuOpen(false); }}>Save project…</button>
                <button type="button" className="w-full text-left px-3 py-2 hover:bg-surface-700" onClick={() => { loadProject(); setMenuOpen(false); }}>Load project…</button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 min-w-0" {...uiSectionProps(UI_SECTIONS.studioHeaderProviderBadge)}>
          <ProviderBadge
            kind="Video"
            providerName={videoDisplay.providerName}
            modelLabel={videoDisplay.modelLabel}
            connected={videoConnected}
            status={videoStatus}
            sectionId={UI_SECTIONS.studioHeaderVideoProviderBadge.id}
          />
          <ProviderBadge
            kind="Image"
            providerName={imageDisplay.providerName}
            modelLabel={imageDisplay.modelLabel}
            connected={imageConnected}
            status={imageStatus}
            sectionId={UI_SECTIONS.studioHeaderImageProviderBadge.id}
          />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2" {...uiSectionProps(UI_SECTIONS.studioHeaderProjectSettings)}>
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

        <div
          className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2 border border-surface-700"
          title="Output clip length for Generate"
        >
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

      <div className="flex items-center gap-2 flex-shrink-0" {...uiSectionProps(UI_SECTIONS.studioHeaderActions)}>
        <button type="button" onClick={saveProject} title="Save project as JSON" className="p-2 hover:bg-surface-700 rounded-lg transition-all group">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>
        <button type="button" onClick={() => loadProject()} title="Load project from JSON" className="p-2 hover:bg-surface-700 rounded-lg transition-all group">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={exportVideo}
          disabled
          title="Export coming soon"
          className="bg-surface-700 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 opacity-50 cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Export (soon)</span>
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