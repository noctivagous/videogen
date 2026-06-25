'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { KeyRound, Search, Settings } from 'lucide-react';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { isBuiltInProviderEnabled } from '@/lib/constants/providers';
import {
  getAvailableImageModels,
  getAvailableVideoModels,
  getBuiltInProvider,
  getEffectiveModelId,
  getEffectivePreviewModelId,
  getProviderDiscovery,
  getProviderStatus,
  hasVerifiedImageModels,
  hasVerifiedVideoModels,
  mergeProviderCapabilities,
  sortBuiltInProviders,
  sortCustomProviders,
} from '@/lib/studio/provider-modalities';
import { isCustomProvider, isProviderConnected } from '@/lib/storage/ai-settings';
import type { AIState } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

type ProviderBadgeKind = 'Video' | 'Image';
type ProviderModality = 'video' | 'image';

function providerSupportsModality(
  providerId: string,
  isCustom: boolean,
  ai: AIState,
  modality: ProviderModality,
  selectedProviderId: string,
): boolean {
  if (providerId === selectedProviderId) return true;

  if (modality === 'video' && hasVerifiedVideoModels(providerId, isCustom, ai)) return true;
  if (modality === 'image' && hasVerifiedImageModels(providerId, isCustom, ai)) return true;

  if (isCustom) {
    return isProviderConnected(providerId, true, ai);
  }

  const builtIn = getBuiltInProvider(providerId);
  if (!builtIn || !isBuiltInProviderEnabled(providerId)) return false;

  const discovery = getProviderDiscovery(providerId, false, ai);
  const { modalities } = mergeProviderCapabilities(
    builtIn.purposes,
    builtIn.modalities,
    discovery,
  );
  return modalities.includes(modality);
}

function listProvidersForModality(
  ai: AIState,
  modality: ProviderModality,
  selectedProviderId: string,
) {
  const builtIn = sortBuiltInProviders(ai)
    .filter((provider) => providerSupportsModality(provider.id, false, ai, modality, selectedProviderId))
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      fallbackIcon: provider.icon,
      isCustom: false as const,
    }));

  const custom = sortCustomProviders(ai)
    .filter((provider) => providerSupportsModality(provider.id, true, ai, modality, selectedProviderId))
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      fallbackIcon: '🛠️',
      isCustom: true as const,
    }));

  return [...builtIn, ...custom];
}

function matchesMenuSearch(text: string, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return text.toLowerCase().includes(normalized);
}

function MenuSectionHeader({
  label,
  searchId,
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder,
  className = '',
}: {
  label: string;
  searchId: string;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchPlaceholder: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 ${className}`.trim()}>
      <div className="text-[10px] uppercase tracking-wider text-gray-500 flex-shrink-0">
        {label}
      </div>
      <div className="relative ml-auto min-w-0 w-[7.5rem] flex-shrink-0">
        <Search
          className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          id={searchId}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          placeholder={searchPlaceholder}
          className="w-full rounded-full bg-surface-900/80 border border-surface-600 pl-7 pr-2.5 py-1 text-[10px] text-gray-200 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-brand-500/60 focus:border-brand-500/40"
        />
      </div>
    </div>
  );
}

export function ProviderBadge({
  kind,
  providerId,
  fallbackIcon,
  providerName,
  modelLabel,
  connected,
  status,
  sectionId,
}: {
  kind: ProviderBadgeKind;
  providerId?: string;
  fallbackIcon: string;
  providerName: string;
  modelLabel: string | null;
  connected: boolean;
  status: ReturnType<typeof getProviderStatus>;
  sectionId: string;
}) {
  const modality: ProviderModality = kind === 'Video' ? 'video' : 'image';
  const ai = useStudioStore((s) => s.ai);
  const navigateToPanel = useNavigateToStudioPanel();
  const openProviderEdit = useStudioStore((s) => s.openProviderEdit);
  const setDefaultVideoProvider = useStudioStore((s) => s.setDefaultVideoProvider);
  const setDefaultVideoModel = useStudioStore((s) => s.setDefaultVideoModel);
  const setDefaultImageProvider = useStudioStore((s) => s.setDefaultImageProvider);
  const setDefaultImageModel = useStudioStore((s) => s.setDefaultImageModel);

  const selectedProviderId = modality === 'video' ? ai.defaultVideoProvider : ai.defaultImageProvider;
  const selectedIsCustom = isCustomProvider(selectedProviderId, ai);
  const models = modality === 'video'
    ? getAvailableVideoModels(selectedProviderId, selectedIsCustom, ai)
    : getAvailableImageModels(selectedProviderId, selectedIsCustom, ai);
  const selectedModelId = modality === 'video'
    ? getEffectiveModelId(ai)
    : getEffectivePreviewModelId(ai);

  const providers = useMemo(
    () => listProvidersForModality(ai, modality, selectedProviderId),
    [ai, modality, selectedProviderId],
  );

  const [open, setOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const providerSearchId = useId();
  const modelSearchId = useId();

  const filteredProviders = useMemo(() => {
    const query = providerSearch.trim();
    if (!query) return providers;
    return providers.filter(
      (provider) => matchesMenuSearch(provider.name, query) || matchesMenuSearch(provider.id, query),
    );
  }, [providers, providerSearch]);

  const filteredModels = useMemo(() => {
    const query = modelSearch.trim();
    if (!query) return models;
    return models.filter(
      (model) => matchesMenuSearch(model.name, query) || matchesMenuSearch(model.id, query),
    );
  }, [models, modelSearch]);

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

  useEffect(() => {
    if (!open) {
      setProviderSearch('');
      setModelSearch('');
    }
  }, [open]);

  const handleProviderSelect = (id: string) => {
    if (modality === 'video') setDefaultVideoProvider(id);
    else setDefaultImageProvider(id);
  };

  const handleModelSelect = (modelId: string) => {
    if (modality === 'video') setDefaultVideoModel(modelId);
    else setDefaultImageModel(modelId);
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
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-lg cursor-pointer transition-all text-xs max-w-[200px] lg:max-w-[220px]"
        title={`${kind} provider & model — click to choose`}
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
        <ProviderIcon
          providerId={providerId}
          fallbackIcon={fallbackIcon}
          size="xs"
          className="rounded-md"
        />
        <div className="min-w-0 text-left leading-tight flex-1">
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
        <span className="text-gray-500 text-[10px] flex-shrink-0" aria-hidden>▾</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`${kind} provider and model`}
          className="absolute top-full right-0 mt-1 w-72 bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-[60] py-1 text-sm"
        >
          <MenuSectionHeader
            label="Provider"
            searchId={providerSearchId}
            searchQuery={providerSearch}
            onSearchQueryChange={setProviderSearch}
            searchPlaceholder="Search…"
            className="pt-2 pb-1"
          />
          <div className={filteredProviders.length > 3 ? 'max-h-[7.5rem] overflow-y-auto' : undefined}>
            {filteredProviders.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">No matching providers</div>
            ) : (
              filteredProviders.map((provider) => {
                const isSelected = provider.id === selectedProviderId;
                const providerStatus = getProviderStatus(provider.id, provider.isCustom, ai);
                return (
                  <div
                    key={provider.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-700 transition-colors ${
                      isSelected ? 'bg-surface-700/70' : ''
                    }`}
                  >
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSelected}
                      onClick={() => handleProviderSelect(provider.id)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    >
                      <ProviderIcon
                        providerId={provider.isCustom ? undefined : provider.id}
                        fallbackIcon={provider.fallbackIcon}
                        size="xs"
                        className="rounded-md"
                      />
                      <span className="flex-1 min-w-0 truncate text-gray-200">{provider.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpen(false);
                        openProviderEdit(provider.id, provider.isCustom);
                      }}
                      className="p-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-surface-600 transition-colors"
                      title={`Configure ${provider.name}`}
                      aria-label={`Configure ${provider.name}`}
                    >
                      <Settings className="w-3.5 h-3.5" aria-hidden />
                    </button>
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        providerStatus === 'verified'
                          ? 'bg-emerald-400'
                          : providerStatus === 'configured' || providerStatus === 'failed'
                            ? 'bg-amber-500'
                            : 'bg-gray-500'
                      }`}
                      aria-hidden
                    />
                  </div>
                );
              })
            )}
          </div>

          <div className="h-px bg-surface-600 my-1" role="separator" />

          <MenuSectionHeader
            label="Model"
            searchId={modelSearchId}
            searchQuery={modelSearch}
            onSearchQueryChange={setModelSearch}
            searchPlaceholder="Search…"
            className="pt-1 pb-1"
          />
          {models.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 leading-snug">
              No verified models for this provider. Open settings to add an API key and test the connection.
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">No matching models</div>
          ) : (
            <div className={filteredModels.length > 3 ? 'max-h-[7.5rem] overflow-y-auto' : undefined}>
              {filteredModels.map((model) => {
                const isSelected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => handleModelSelect(model.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-surface-700 transition-colors truncate ${
                      isSelected ? 'bg-brand-600/15 text-brand-200' : 'text-gray-200'
                    }`}
                  >
                    {model.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="h-px bg-surface-600 my-1" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigateToPanel('settings');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
            Manage API keys…
          </button>
        </div>
      )}
    </div>
  );
}
