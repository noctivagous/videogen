'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
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
  const openSettings = useStudioStore((s) => s.openSettings);
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
          className="absolute top-full right-0 mt-1 w-72 max-h-80 overflow-y-auto bg-surface-800 border border-surface-600 rounded-lg shadow-xl z-[60] py-1 text-sm"
        >
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-500">
            Provider
          </div>
          {providers.map((provider) => {
            const isSelected = provider.id === selectedProviderId;
            const providerStatus = getProviderStatus(provider.id, provider.isCustom, ai);
            return (
              <button
                key={provider.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={() => handleProviderSelect(provider.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-700 transition-colors text-left ${
                  isSelected ? 'bg-surface-700/70' : ''
                }`}
              >
                <ProviderIcon
                  providerId={provider.isCustom ? undefined : provider.id}
                  fallbackIcon={provider.fallbackIcon}
                  size="xs"
                  className="rounded-md"
                />
                <span className="flex-1 min-w-0 truncate text-gray-200">{provider.name}</span>
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
              </button>
            );
          })}

          <div className="h-px bg-surface-600 my-1" role="separator" />

          <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider text-gray-500">
            Model
          </div>
          {models.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 leading-snug">
              No verified models for this provider. Open settings to add an API key and test the connection.
            </div>
          ) : (
            models.map((model) => {
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
            })
          )}

          <div className="h-px bg-surface-600 my-1" role="separator" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openSettings();
            }}
            className="w-full text-left px-3 py-2 hover:bg-surface-700 text-gray-400 hover:text-gray-200 transition-colors text-xs"
          >
            Manage API keys…
          </button>
        </div>
      )}
    </div>
  );
}
