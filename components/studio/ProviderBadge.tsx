'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, Search, Settings } from 'lucide-react';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { isBuiltInProviderEnabled } from '@/lib/constants/providers';
import {
  getAvailableImageModels,
  getAvailableModelsForModality,
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
import type { AIState, Modality } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

type ProviderBadgeKind = 'Video' | 'Image' | 'Audio' | 'LLM';
type ProviderModality = 'video' | 'image' | 'tts' | 'llm';

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
  if ((modality === 'tts' || modality === 'llm') && getAvailableModelsForModality(providerId, isCustom, ai, modality).length > 0) return true;

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
          className="w-full rounded-lg bg-surface-900/80 border border-surface-600 pl-7 pr-2.5 py-1 text-[10px] text-gray-200 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-brand-500/60 focus:border-brand-500/40"
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
  fill = false,
  modalityOverride,
  label,
  selectedProviderId: selectedProviderIdProp,
  selectedModelId: selectedModelIdProp,
  onProviderSelect,
  onModelSelect,
}: {
  kind: ProviderBadgeKind;
  providerId?: string;
  fallbackIcon: string;
  providerName: string;
  modelLabel: string | null;
  connected: boolean;
  status: ReturnType<typeof getProviderStatus>;
  sectionId: string;
  fill?: boolean;
  modalityOverride?: ProviderModality;
  label?: string;
  selectedProviderId?: string;
  selectedModelId?: string;
  onProviderSelect?: (providerId: string) => void;
  onModelSelect?: (modelId: string) => void;
}) {
  const modality: ProviderModality = modalityOverride ?? (
    kind === 'Video' ? 'video' : kind === 'Image' ? 'image' : kind === 'Audio' ? 'tts' : 'llm'
  );
  const ai = useStudioStore((s) => s.ai);
  const navigateToPanel = useNavigateToStudioPanel();
  const openProviderEdit = useStudioStore((s) => s.openProviderEdit);
  const setDefaultVideoProvider = useStudioStore((s) => s.setDefaultVideoProvider);
  const setDefaultVideoModel = useStudioStore((s) => s.setDefaultVideoModel);
  const setDefaultImageProvider = useStudioStore((s) => s.setDefaultImageProvider);
  const setDefaultImageModel = useStudioStore((s) => s.setDefaultImageModel);

  const selectedProviderId = selectedProviderIdProp ?? (
    modality === 'video' ? ai.defaultVideoProvider : ai.defaultImageProvider
  );
  const selectedIsCustom = isCustomProvider(selectedProviderId, ai);
  const models = modality === 'video'
    ? getAvailableVideoModels(selectedProviderId, selectedIsCustom, ai)
    : modality === 'image'
      ? getAvailableImageModels(selectedProviderId, selectedIsCustom, ai)
      : getAvailableModelsForModality(selectedProviderId, selectedIsCustom, ai, modality as Modality);
  const selectedModelId = selectedModelIdProp ?? (
    modality === 'video'
      ? getEffectiveModelId(ai)
      : modality === 'image'
        ? getEffectivePreviewModelId(ai)
        : undefined
  );

  const providers = useMemo(
    () => listProvidersForModality(ai, modality, selectedProviderId),
    [ai, modality, selectedProviderId],
  );

  const [open, setOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const providerSearchId = useId();
  const modelSearchId = useId();
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const MENU_WIDTH = 288;

  const updateMenuPosition = () => {
    if (!buttonRef.current || typeof window === 'undefined') return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportPadding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuHeight = menuRef.current?.offsetHeight ?? 320;

    const rightAlignedLeft = rect.right - MENU_WIDTH;
    const leftAlignedLeft = rect.left;
    const horizontalPenalty = (left: number) => {
      const overflowLeft = Math.max(0, viewportPadding - left);
      const overflowRight = Math.max(0, (left + MENU_WIDTH) - (viewportWidth - viewportPadding));
      return overflowLeft + overflowRight;
    };
    const preferredLeft = horizontalPenalty(rightAlignedLeft) <= horizontalPenalty(leftAlignedLeft)
      ? rightAlignedLeft
      : leftAlignedLeft;
    const maxLeft = Math.max(viewportPadding, viewportWidth - MENU_WIDTH - viewportPadding);
    const left = Math.min(maxLeft, Math.max(viewportPadding, preferredLeft));

    const belowTop = rect.bottom + 6;
    const aboveTop = rect.top - menuHeight - 6;
    const canFitBelow = belowTop + menuHeight <= viewportHeight - viewportPadding;
    const canFitAbove = aboveTop >= viewportPadding;
    const top = (!canFitBelow && canFitAbove)
      ? aboveTop
      : Math.min(
        Math.max(viewportPadding, belowTop),
        Math.max(viewportPadding, viewportHeight - menuHeight - viewportPadding),
      );

    setMenuPosition({
      top,
      left,
    });
  };

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
    updateMenuPosition();

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => updateMenuPosition());
    return () => cancelAnimationFrame(frame);
  }, [open, filteredProviders.length, filteredModels.length, providerSearch, modelSearch]);

  useEffect(() => {
    if (!open) {
      setProviderSearch('');
      setModelSearch('');
    }
  }, [open]);

  const handleProviderSelect = (id: string) => {
    if (onProviderSelect) {
      onProviderSelect(id);
      return;
    }
    if (modality === 'video') setDefaultVideoProvider(id);
    else if (modality === 'image') setDefaultImageProvider(id);
  };

  const handleModelSelect = (modelId: string) => {
    if (onModelSelect) {
      onModelSelect(modelId);
    } else if (modality === 'video') {
      setDefaultVideoModel(modelId);
    } else if (modality === 'image') {
      setDefaultImageModel(modelId);
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`pro-matte-glass flex items-center gap-2 px-3 py-1.5 text-xs ${
          fill ? 'w-full h-full max-w-none' : 'max-w-[200px] lg:max-w-[220px]'
        }`}
        title={`${label ?? kind} provider & model — click to choose`}
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
          <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold truncate">{label ?? kind}</div>
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

      {open && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`${kind} provider and model`}
          className="pro-menu fixed w-72 z-[80] py-1 text-sm"
          style={{ top: menuPosition.top, left: menuPosition.left }}
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
                    className={`pro-menu-item flex items-center gap-2 ${
                      isSelected ? 'pro-menu-item--active' : ''
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
                    className={`pro-menu-item truncate ${
                      isSelected ? 'pro-menu-item--active' : ''
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
            className="pro-menu-item flex items-center gap-2 text-xs text-gray-400"
          >
            <KeyRound className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
            Manage API keys…
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
