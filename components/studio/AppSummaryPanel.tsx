'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, Circle, KeyRound, Search, Video } from 'lucide-react';
import { AppsLauncherGrid } from '@/components/studio/AppsLauncherGrid';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import {
  checklistSettingsPath,
  categorySettingsPath,
  FEATURE_CHECKLIST_ITEMS,
  MODEL_CATEGORY_DEFINITIONS,
  providerSettingsPath,
} from '@/lib/constants/model-catalog';
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
import { isCustomProvider, isProviderConnected } from '@/lib/storage/ai-settings';
import type { SavedProjectSummary } from '@/lib/storage/saved-projects-store';
import { useStudioStore } from '@/store/useStudioStore';

function matchesSearch(text: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return text.toLowerCase().includes(normalized);
}

function SummarySection({
  title,
  summary,
  searchId,
  searchQuery,
  onSearchQueryChange,
  children,
}: {
  title: string;
  summary: string;
  searchId?: string;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  children: ReactNode;
}) {
  const showSearch = searchId != null && onSearchQueryChange != null && searchQuery != null;

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-800/40 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-surface-700/80">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-100">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{summary}</p>
        </div>
        {showSearch ? (
          <div className="relative ml-auto min-w-0 w-[7.5rem] flex-shrink-0 pt-0.5">
            <Search
              className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"
              aria-hidden
            />
            <input
              type="search"
              id={searchId}
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search…"
              className="w-full rounded-full bg-surface-900/80 border border-surface-600 pl-7 pr-2.5 py-1 text-[10px] text-gray-200 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-brand-500/60 focus:border-brand-500/40"
            />
          </div>
        ) : null}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
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
  const functionalChecklist = useMemo(() => FEATURE_CHECKLIST_ITEMS.map((item) => {
    const categoryChecks = item.categories.map((categoryId) => {
      const slot = ai.modelSlots?.[categoryId];
      const hasSlot = slot != null;
      const hasModel = (slot?.modelId ?? '').trim().length > 0;
      const providerId = slot?.providerId ?? '';
      const providerConnected = providerId.length > 0
        ? isProviderConnected(providerId, isCustomProvider(providerId, ai), ai)
        : false;
      return {
        categoryId,
        label: MODEL_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId)?.label ?? categoryId,
        description: MODEL_CATEGORY_DEFINITIONS.find((entry) => entry.id === categoryId)?.description ?? '',
        providerId,
        hasSlot,
        hasModel,
        providerConnected,
        notReadyReasons: [
          ...(hasSlot ? [] : ['slot missing']),
          ...(hasSlot && !hasModel ? ['model missing'] : []),
          ...(hasSlot && !providerConnected ? ['provider not connected'] : []),
        ],
        ready: hasSlot && hasModel && providerConnected,
      };
    });
    const readyCategoryCount = categoryChecks.filter((category) => category.ready).length;
    const notReadyDetails = categoryChecks
      .filter((category) => !category.ready)
      .map((category) => `${category.label}: ${category.notReadyReasons.join(', ')}`);
    const providersOrdered = [...item.providers]
      .sort((a, b) => {
        const aEnabled = isBuiltInProviderEnabled(a.id);
        const bEnabled = isBuiltInProviderEnabled(b.id);
        if (aEnabled !== bEnabled) return aEnabled ? -1 : 1;
        return a.label.localeCompare(b.label);
      })
      .map((provider) => ({
        ...provider,
        enabled: isBuiltInProviderEnabled(provider.id),
        connected: isProviderConnected(provider.id, isCustomProvider(provider.id, ai), ai),
      }));

    return {
      ...item,
      categoryChecks,
      providersOrdered,
      readyCategoryCount,
      totalCategoryCount: categoryChecks.length,
      whyNotReadyMessage: notReadyDetails.length > 0
        ? `Why not ready? ${notReadyDetails.join(' | ')}`
        : 'Ready',
      ready: categoryChecks.every((category) => category.ready),
    };
  }), [ai]);
  const readyChecklistCount = functionalChecklist.filter((item) => item.ready).length;

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
        <SummarySection
          title="App feature checklist"
          summary={`${readyChecklistCount}/${functionalChecklist.length} features ready (provider connected + model mapped)`}
        >
          <ul className="space-y-2">
            {functionalChecklist.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-surface-700 bg-surface-900/40 px-3 py-2 text-xs text-gray-300"
              >
                <div className="flex items-start gap-2">
                  <span title={item.whyNotReadyMessage}>
                    {item.ready ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-400 flex-shrink-0" aria-hidden />
                    ) : (
                      <Circle className="w-3.5 h-3.5 mt-0.5 text-amber-300 flex-shrink-0" aria-hidden />
                    )}
                  </span>
                  <span
                    aria-hidden
                    className="mt-0.5 w-10 h-10 rounded-sm border border-dashed border-surface-500 bg-surface-800/70 flex-shrink-0"
                    title="Feature thumbnail placeholder"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-100 leading-tight">{item.title}</div>
                      {item.ready ? (
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex-shrink-0 text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                        >
                          Ready
                        </span>
                      ) : (
                        <Link
                          href={checklistSettingsPath(item.id)}
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md border flex-shrink-0 text-amber-200 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                          title={`Open setup checklist for ${item.title}`}
                        >
                          <span>Needs setup</span>
                          <ArrowRight className="w-3 h-3" aria-hidden />
                        </Link>
                      )}
                    </div>

                    <div className="mt-1.5 grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-2 gap-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 pt-0.5">Requires</div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] text-gray-400 mr-0.5">
                          ({item.readyCategoryCount}/{item.totalCategoryCount})
                        </span>
                        {item.categoryChecks.map((category) => (
                          <span key={category.categoryId} className="relative inline-flex group">
                            <Link
                              href={categorySettingsPath(category.categoryId)}
                              title={category.description}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                                category.ready
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                  : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                              }`}
                            >
                              <span
                                aria-hidden
                                className="w-[0.78125rem] h-[0.78125rem] rounded-sm border border-surface-500/80 bg-surface-800/80 flex-shrink-0"
                                title="Category thumbnail placeholder"
                              />
                              <span>{category.ready ? '✓' : '○'}</span>
                              <span>{category.label}</span>
                            </Link>
                            <span className="pointer-events-none absolute left-0 -top-1 -translate-y-full hidden group-hover:block group-focus-within:block z-20 w-56 rounded-md border border-surface-600 bg-surface-900/95 px-2 py-1.5 text-[10px] leading-relaxed text-gray-300 shadow-lg">
                              {category.description}
                            </span>
                          </span>
                        ))}
                      </div>

                      <div className="text-[10px] uppercase tracking-wider text-gray-500 pt-0.5">Providers</div>
                      <div className="flex flex-wrap items-center gap-1">
                        {item.providersOrdered.map((provider) => {
                          const providerMeta = BUILT_IN_PROVIDERS.find((entry) => entry.id === provider.id);
                          return (
                            <Link
                              key={provider.id}
                              href={providerSettingsPath(provider.id)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-brand-500/30 bg-brand-500/10 text-brand-200 hover:bg-brand-500/20 transition-colors"
                            >
                              <span
                                aria-hidden
                                className={`w-1.5 h-1.5 rounded-full ${
                                  provider.connected
                                    ? 'bg-emerald-400'
                                    : provider.enabled
                                      ? 'bg-amber-400'
                                      : 'bg-gray-500'
                                }`}
                              />
                              <ProviderIcon
                                providerId={provider.id}
                                fallbackIcon={providerMeta?.icon ?? provider.label[0] ?? '•'}
                                size="xs"
                              />
                              <span>{provider.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SummarySection>

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
