'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { CheckCircle2, KeyRound, Video } from 'lucide-react';
import { AppFeatureChecklistSection } from '@/components/studio/AppFeatureChecklistSection';
import { AppsLauncherGrid } from '@/components/studio/AppsLauncherGrid';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import { SummarySection } from '@/components/studio/SummarySection';
import { useAppsLauncher } from '@/hooks/use-apps-launcher';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import {
  BUILT_IN_PROVIDERS,
  ENABLED_PROVIDER_IDS,
  isBuiltInProviderEnabled,
} from '@/lib/constants/providers';
import {
  formatProjectDiskSize,
  PROJECT_SUMMARY_STAT_LABELS,
  type ProjectSummaryStats,
} from '@/lib/studio/project-summary-stats';
import { getLiveProjectThumbnailUrl } from '@/lib/studio/project-thumbnail';
import { getProviderStatus } from '@/lib/studio/provider-modalities';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { isProviderConnected } from '@/lib/storage/ai-settings';
import type { SavedProjectSummary } from '@/lib/storage/saved-projects-store';
import { useStudioStore } from '@/store/useStudioStore';

function matchesSearch(text: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return text.toLowerCase().includes(normalized);
}

function ProjectStatChip({ label, count }: { label: string; count: number }) {
  return (
    <span className="px-1 py-0.5 rounded-md bg-surface-800/90 border border-surface-600 text-[8px] font-medium text-gray-300 whitespace-nowrap">
      {label}:{count}
    </span>
  );
}

function ProjectThumbnailPlaceholder({ stats }: { stats: ProjectSummaryStats }) {
  return (
    <div className="absolute inset-0 flex flex-wrap items-center justify-center content-center gap-1 p-1.5 bg-surface-900">
      {PROJECT_SUMMARY_STAT_LABELS.map(({ key, label }) => (
        <ProjectStatChip key={key} label={label} count={stats[key]} />
      ))}
    </div>
  );
}

function ProjectSummaryListItem({
  entry,
  onSelect,
}: {
  entry: SavedProjectSummary;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 hover:bg-surface-700/80 transition-colors flex gap-3 ${
        entry.isActive ? 'bg-brand-600/10' : ''
      }`}
    >
      <div className="w-24 aspect-video rounded-md overflow-hidden bg-surface-900 relative flex-shrink-0 border border-surface-700">
        {entry.thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.thumbnailUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-0.5 p-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
              {PROJECT_SUMMARY_STAT_LABELS.map(({ key, label }) => (
                <ProjectStatChip key={key} label={label} count={entry.stats[key]} />
              ))}
            </div>
          </>
        ) : (
          <ProjectThumbnailPlaceholder stats={entry.stats} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium text-gray-100">{entry.name}</span>
              {entry.isActive ? (
                <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wide text-brand-300">
                  Active
                </span>
              ) : null}
            </div>
            {entry.locationLabel ? (
              <div className="truncate text-[10px] text-gray-500 mt-0.5">{entry.locationLabel}</div>
            ) : null}
          </div>
          <div
            className="text-[10px] text-gray-500 flex-shrink-0 tabular-nums"
            title="Estimated project size"
          >
            {formatProjectDiskSize(entry.stats.diskBytes)}
          </div>
        </div>
        {!entry.thumbnailUrl ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PROJECT_SUMMARY_STAT_LABELS.map(({ key, label }) => (
              <span
                key={key}
                className="px-1.5 py-0.5 rounded-md bg-surface-800 border border-surface-600 text-[9px] font-medium text-gray-400"
              >
                {label}: {entry.stats[key]}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function ProviderSummaryListItem({
  name,
  providerId,
  icon,
  connected,
  status,
}: {
  name: string;
  providerId: string;
  icon: string;
  connected: boolean;
  status: ReturnType<typeof getProviderStatus>;
}) {
  const statusLabel = connected
    ? 'Connected'
    : status === 'verified'
      ? 'Verified'
      : status === 'configured'
        ? 'Configured'
        : status === 'failed'
          ? 'Test failed'
          : 'Not configured';

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-700/50 transition-colors">
      <ProviderIcon providerId={providerId} fallbackIcon={icon} size="xs" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-100 truncate">{name}</div>
        <div className={`text-[10px] mt-0.5 ${connected ? 'text-emerald-400' : 'text-gray-500'}`}>
          {statusLabel}
        </div>
      </div>
      {connected ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden />
      ) : null}
    </li>
  );
}

export function AppSummaryPanel() {
  const { items, activeItemId, selectItem } = useAppsLauncher();
  const navigateToPanel = useNavigateToStudioPanel();
  const savedProjects = useStudioStore((s) => s.savedProjects);
  const activeProjectId = useStudioStore((s) => s.activeProjectId);
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const currentCoverageShotId = useStudioStore((s) => s.currentCoverageShotId);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const switchToSavedProject = useStudioStore((s) => s.switchToSavedProject);
  const refreshSavedProjects = useStudioStore((s) => s.refreshSavedProjects);
  const ai = useStudioStore((s) => s.ai);
  const providerSearchId = useId();
  const [providerSearchQuery, setProviderSearchQuery] = useState('');

  useEffect(() => {
    void refreshSavedProjects();
  }, [refreshSavedProjects]);

  const liveThumbnail = useMemo(
    () => getLiveProjectThumbnailUrl({
      setups,
      currentSetupId,
      currentCoverageShotId,
      globalMediaLibrary,
    }),
    [setups, currentSetupId, currentCoverageShotId, globalMediaLibrary],
  );

  const sortedProjects = useMemo(
    () => [...savedProjects]
      .map((entry) => ({
        ...entry,
        thumbnailUrl: entry.id === activeProjectId
          ? (liveThumbnail ?? entry.thumbnailUrl)
          : entry.thumbnailUrl,
      }))
      .sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [savedProjects, activeProjectId, liveThumbnail],
  );

  const enabledProviders = useMemo(
    () => BUILT_IN_PROVIDERS.filter((provider) => isBuiltInProviderEnabled(provider.id)),
    [],
  );

  const filteredProviders = useMemo(
    () => enabledProviders.filter(
      (provider) => matchesSearch(provider.name, providerSearchQuery)
        || matchesSearch(provider.desc, providerSearchQuery),
    ),
    [enabledProviders, providerSearchQuery],
  );

  const connectedProviderCount = useMemo(
    () => enabledProviders.filter((provider) => isProviderConnected(provider.id, false, ai)).length,
    [enabledProviders, ai],
  );

  const projectCountLabel = savedProjects.length === 1 ? '1 project' : `${savedProjects.length} projects`;
  const providerCountLabel = `${ENABLED_PROVIDER_IDS.length} available of ${BUILT_IN_PROVIDERS.length} built-in providers`;
  const connectedLabel = connectedProviderCount === 1
    ? '1 connected'
    : `${connectedProviderCount} connected`;
  return (
    <div
      className="h-full flex flex-col bg-surface-900 min-h-0"
      {...uiSectionProps(UI_SECTIONS.studioAppSummaryPanel)}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-700 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
          <Video className="w-4 h-4 text-white" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-100">VideoGen</h1>
          <p className="text-[10px] text-gray-500">
            Shot design, media library, reference tools, and settings
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        <AppFeatureChecklistSection />

        <SummarySection title="Apps" summary="Open a studio tool or workspace">
          <AppsLauncherGrid
            items={items}
            activeItemId={activeItemId}
            onSelect={selectItem}
          />
        </SummarySection>

        <SummarySection title="Projects" summary={projectCountLabel}>
          {sortedProjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-600 px-4 py-6 text-center text-sm text-gray-500">
              No saved projects yet.
            </div>
          ) : (
            <div className="rounded-lg border border-surface-700 bg-surface-900/40 overflow-hidden divide-y divide-surface-700">
              {sortedProjects.map((entry) => (
                <ProjectSummaryListItem
                  key={entry.id}
                  entry={entry}
                  onSelect={() => {
                    if (entry.id !== activeProjectId) {
                      void switchToSavedProject(entry.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </SummarySection>

        <SummarySection
          title="AI Providers"
          summary={`${providerCountLabel} · ${connectedLabel}`}
          searchId={providerSearchId}
          searchQuery={providerSearchQuery}
          onSearchQueryChange={setProviderSearchQuery}
        >
          {filteredProviders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-600 px-4 py-6 text-center text-sm text-gray-500">
              No providers match your search.
            </div>
          ) : (
            <div className="rounded-lg border border-surface-700 bg-surface-900/40 overflow-hidden">
              <ul className="divide-y divide-surface-700">
                {filteredProviders.map((provider) => (
                  <ProviderSummaryListItem
                    key={provider.id}
                    providerId={provider.id}
                    name={provider.name}
                    icon={provider.icon}
                    connected={isProviderConnected(provider.id, false, ai)}
                    status={getProviderStatus(provider.id, false, ai)}
                  />
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => navigateToPanel('settings')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 text-gray-300 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" aria-hidden />
            Manage providers
          </button>
        </SummarySection>
      </div>
    </div>
  );
}
