'use client';

import { ProviderCard } from '@/components/studio/ProviderCard';
import {
  getAvailableImageModels,
  getAvailableVideoModels,
  getEffectiveModelId,
  getEffectivePreviewModelId,
  sortBuiltInProviders,
  sortCustomProviders,
} from '@/lib/studio/provider-modalities';
import { ENABLED_PROVIDER_IDS, isBuiltInProviderEnabled } from '@/lib/constants/providers';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { isCustomProvider } from '@/lib/storage/ai-settings';
import { useStudioStore } from '@/store/useStudioStore';

function ProviderModelFields({
  label,
  providerId,
  onProviderChange,
  models,
  selectedModelId,
  onModelChange,
  modelLabel,
}: {
  label: string;
  providerId: string;
  onProviderChange: (id: string) => void;
  models: ReturnType<typeof getAvailableVideoModels>;
  selectedModelId: string | undefined;
  onModelChange: (id: string) => void;
  modelLabel: string;
}) {
  const ai = useStudioStore((s) => s.ai);
  const sortedBuiltIn = sortBuiltInProviders(ai);

  return (
    <div className="flex-1 min-w-0 space-y-3">
      <h3 className="font-semibold text-sm text-gray-200">{label}</h3>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">Provider</label>
        <select
          value={providerId}
          onChange={(e) => onProviderChange(e.target.value)}
          className="w-full bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all select-arrow appearance-none"
        >
          {sortedBuiltIn.filter((p) => isBuiltInProviderEnabled(p.id)).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1.5">{modelLabel}</label>
        <select
          value={selectedModelId ?? ''}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={models.length === 0}
          className="w-full bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all select-arrow appearance-none disabled:opacity-50"
        >
          {models.length === 0 ? (
            <option value="">No models — test connection first</option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}

export function SettingsProvidersContent({ className = '' }: { className?: string }) {
  const ai = useStudioStore((s) => s.ai);
  const setDefaultVideoProvider = useStudioStore((s) => s.setDefaultVideoProvider);
  const setDefaultVideoModel = useStudioStore((s) => s.setDefaultVideoModel);
  const setDefaultImageProvider = useStudioStore((s) => s.setDefaultImageProvider);
  const setDefaultImageModel = useStudioStore((s) => s.setDefaultImageModel);

  const sortedBuiltIn = sortBuiltInProviders(ai);
  const sortedCustom = sortCustomProviders(ai);
  const isCustomVideo = isCustomProvider(ai.defaultVideoProvider, ai);
  const isCustomImage = isCustomProvider(ai.defaultImageProvider, ai);
  const videoModels = getAvailableVideoModels(ai.defaultVideoProvider, isCustomVideo, ai);
  const imageModels = getAvailableImageModels(ai.defaultImageProvider, isCustomImage, ai);
  const selectedVideoModelId = getEffectiveModelId(ai);
  const selectedImageModelId = getEffectivePreviewModelId(ai);

  return (
    <div className={`space-y-8 ${className}`.trim()}>
      <div className="glass rounded-3xl p-6 border border-surface-700" {...uiSectionProps(UI_SECTIONS.studioSettingsDefaultProvider)}>
        <div className="mb-5">
          <h2 className="font-semibold text-lg">Default Providers & Models</h2>
          <p className="text-sm text-gray-400">
            Pick separate providers for video generation and image preview. Each needs its own API key and tested model list.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <ProviderModelFields
            label="Video generation"
            providerId={ai.defaultVideoProvider}
            onProviderChange={setDefaultVideoProvider}
            models={videoModels}
            selectedModelId={selectedVideoModelId}
            onModelChange={setDefaultVideoModel}
            modelLabel="Video model"
          />
          <div className="hidden lg:block w-px bg-surface-700 self-stretch" />
          <ProviderModelFields
            label="Image preview"
            providerId={ai.defaultImageProvider}
            onProviderChange={setDefaultImageProvider}
            models={imageModels}
            selectedModelId={selectedImageModelId}
            onModelChange={setDefaultImageModel}
            modelLabel="Image model"
          />
        </div>
      </div>

      <div {...uiSectionProps(UI_SECTIONS.studioSettingsBuiltInProviders)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-2xl tracking-tight">Built-in Providers</h2>
          <div className="text-xs px-3 py-1 rounded-full bg-surface-800 text-gray-400 border border-surface-700">
            {ENABLED_PROVIDER_IDS.length} of {sortedBuiltIn.length} available
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedBuiltIn.map((p) => (
            <ProviderCard key={p.id} provider={p} isCustom={false} />
          ))}
        </div>
      </div>

      <div {...uiSectionProps(UI_SECTIONS.studioSettingsCustomProviders)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-2xl tracking-tight">Custom Providers</h2>
          <button
            type="button"
            disabled
            title="Custom providers not yet available"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-2xl bg-surface-800 border border-surface-700 text-gray-500 cursor-not-allowed"
          >
            Add Custom Provider
          </button>
        </div>
        {sortedCustom.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No custom providers yet. Add one above to support additional services.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedCustom.map((p) => (
              <ProviderCard key={p.id} provider={p} isCustom />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
