'use client';

import { ModalityChips } from '@/components/studio/ModalityChips';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import { ManagedModal } from '@/components/ui/ModalManager';
import { useEffect, useState } from 'react';
import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { getProviderDiscovery } from '@/lib/studio/provider-modalities';
import { getProviderApiKey, isServerManagedProvider } from '@/lib/storage/ai-settings';
import type { ProviderModel } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

type TestUiState = 'idle' | 'testing' | 'success' | 'error';

export function ProviderEditModal() {
  const providerEdit = useStudioStore((s) => s.providerEdit);
  const ai = useStudioStore((s) => s.ai);
  const closeProviderEdit = useStudioStore((s) => s.closeProviderEdit);
  const saveProviderEdit = useStudioStore((s) => s.saveProviderEdit);
  const applyProviderTestResult = useStudioStore((s) => s.applyProviderTestResult);
  const deleteCustomProvider = useStudioStore((s) => s.deleteCustomProvider);
  const showToast = useStudioStore((s) => s.showToast);

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [testUi, setTestUi] = useState<TestUiState>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testModels, setTestModels] = useState<ProviderModel[]>([]);
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    if (!providerEdit) return;
    const key = getProviderApiKey(providerEdit.id, providerEdit.isCustom, ai);
    setApiKey(key);
    setShowKey(false);
    setTestUi('idle');
    setTestMessage(null);
    setTestModels([]);
    setShowModels(false);

    const discovery = getProviderDiscovery(providerEdit.id, providerEdit.isCustom, ai);
    if (discovery?.lastTestMessage) {
      setTestMessage(discovery.lastTestMessage);
      setTestUi(discovery.lastTestOk ? 'success' : 'error');
      setTestModels(discovery.models ?? []);
    }

    if (providerEdit.isCustom) {
      const prov = ai.customProviders.find((p) => p.id === providerEdit.id);
      setCustomName(prov?.name || '');
      setCustomDesc(prov?.desc || '');
      setCustomBaseUrl(prov?.baseUrl || '');
    }
  }, [providerEdit, ai]);

  if (!providerEdit) return null;

  const serverManaged = !providerEdit.isCustom && isServerManagedProvider(providerEdit.id, false, ai);
  const builtIn = BUILT_IN_PROVIDERS.find((p) => p.id === providerEdit.id);
  const custom = providerEdit.isCustom
    ? ai.customProviders.find((p) => p.id === providerEdit.id)
    : null;

  const displayName = providerEdit.isCustom ? custom?.name : builtIn?.name;
  const displayIcon = providerEdit.isCustom ? '🛠️' : builtIn?.icon ?? '🔌';
  const displayHint = providerEdit.isCustom ? custom?.baseUrl : builtIn?.hint;

  const testConnection = async () => {
    if (!apiKey.trim() && !serverManaged) {
      setTestMessage('Please enter an API key before testing.');
      setTestUi('error');
      showToast('Please enter an API key', 'error');
      return;
    }

    setTestUi('testing');
    setTestMessage(null);
    setTestModels([]);
    setShowModels(false);

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: providerEdit.id,
          isCustom: providerEdit.isCustom,
          apiKey,
          customBaseUrl: providerEdit.isCustom ? customBaseUrl : undefined,
        }),
      });
      const result = (await res.json()) as ProviderTestResult;
      setTestMessage(result.message);
      setTestUi(result.ok ? 'success' : 'error');
      setTestModels(result.models ?? []);
      applyProviderTestResult(providerEdit.id, providerEdit.isCustom, result, apiKey);
      showToast(result.message, result.ok ? 'success' : 'error');
    } catch {
      const message = 'Connection test failed — check network and try again.';
      setTestMessage(message);
      setTestUi('error');
      applyProviderTestResult(providerEdit.id, providerEdit.isCustom, { ok: false, message }, apiKey);
      showToast(message, 'error');
    }
  };

  const testButtonLabel = testUi === 'testing'
    ? 'Testing…'
    : testUi === 'success'
      ? 'Verified'
      : testUi === 'error'
        ? 'Failed'
        : 'Test Connection';

  return (
    <ManagedModal
      open
      onClose={closeProviderEdit}
      className="glass pro-panel w-full max-w-md rounded-lg border border-surface-700 overflow-hidden modal"
      {...uiSectionProps(UI_SECTIONS.studioProviderEditModal)}
    >
        <div className="px-6 py-5 border-b border-surface-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProviderIcon
              providerId={providerEdit.isCustom ? undefined : providerEdit.id}
              fallbackIcon={displayIcon}
              size="sm"
            />
            <div>
              <div className="font-semibold">{displayName}</div>
              <div className="text-xs text-gray-400">{displayHint}</div>
            </div>
          </div>
          <button type="button" onClick={closeProviderEdit} className="p-2 hover:bg-surface-700 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5" {...uiSectionProps(UI_SECTIONS.studioProviderEditForm)}>
          {!providerEdit.isCustom && builtIn && (
            <div className="text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-brand-400">ℹ︎</span>
                <span>{builtIn.hint}</span>
              </div>
              <ModalityChips purposes={builtIn.purposes} modalities={[]} showModalities={false} compact />
            </div>
          )}

          {providerEdit.isCustom && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1.5">Provider Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1.5">Description</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1.5">Base URL</label>
                <input
                  type="url"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-3 text-sm outline-none font-mono text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs uppercase tracking-wider text-gray-400 block mb-1.5">API Key</label>
            {serverManaged && (
              <p className="text-xs text-emerald-400/90 mb-2">
                Configured on the server via environment variable — leave blank to use it, or enter a key to override in this browser.
              </p>
            )}
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={serverManaged ? 'Using server key' : undefined}
                className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-3 pr-12 text-sm outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showKey ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {testMessage && (
            <div className={`test-result-alert ${testUi === 'success' ? 'test-result-alert--success' : 'test-result-alert--error'}`}>
              {testMessage}
            </div>
          )}

          {testModels.length > 0 && (
            <div className="rounded-lg border border-surface-600 bg-surface-800/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowModels(!showModels)}
                className="w-full px-4 py-3 text-left text-sm font-medium flex items-center justify-between hover:bg-surface-700/50"
              >
                <span>{testModels.length} model{testModels.length === 1 ? '' : 's'} discovered</span>
                <span className="text-gray-400">{showModels ? '−' : '+'}</span>
              </button>
              {showModels && (
                <div className="px-4 pb-3 space-y-2 max-h-40 overflow-y-auto">
                  {testModels.map((model) => (
                    <div key={model.id} className="text-xs border border-surface-600 rounded-xl px-3 py-2">
                      <div className="font-medium text-gray-200">{model.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono truncate">{model.id}</div>
                      <ModalityChips modalities={model.modalities} purposes={model.purposes} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={testConnection}
              disabled={testUi === 'testing'}
              className={`flex-1 px-5 py-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                testUi === 'success'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : testUi === 'error'
                    ? 'border-red-500/40 bg-red-500/10 text-red-300'
                    : 'border-surface-600 hover:bg-surface-700'
              }`}
            >
              {testUi === 'testing' && <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {testUi === 'success' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {testUi === 'error' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {testButtonLabel}
            </button>
            <button
              type="button"
              onClick={() => saveProviderEdit(apiKey, providerEdit.isCustom ? { name: customName, desc: customDesc, baseUrl: customBaseUrl } : undefined)}
              className="flex-1 px-5 py-3 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold"
            >
              Save Key
            </button>
          </div>

          {providerEdit.isCustom && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Remove this custom provider?')) {
                  deleteCustomProvider(providerEdit.id);
                }
              }}
              className="w-full text-sm py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/30 transition-all"
            >
              Remove this custom provider
            </button>
          )}
        </div>
    </ManagedModal>
  );
}