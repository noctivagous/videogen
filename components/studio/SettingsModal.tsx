'use client';

import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import { isProviderConnected } from '@/lib/storage/ai-settings';
import { useStudioStore } from '@/store/useStudioStore';

export function SettingsModal() {
  const settingsOpen = useStudioStore((s) => s.settingsOpen);
  const ai = useStudioStore((s) => s.ai);
  const closeSettings = useStudioStore((s) => s.closeSettings);
  const setDefaultProvider = useStudioStore((s) => s.setDefaultProvider);
  const openProviderEdit = useStudioStore((s) => s.openProviderEdit);
  const addCustomProvider = useStudioStore((s) => s.addCustomProvider);
  const showToast = useStudioStore((s) => s.showToast);

  if (!settingsOpen) return null;

  const handleAddCustom = () => {
    const name = prompt('Custom Provider Name:', 'My Custom Video API');
    if (!name) return;
    const baseUrl = prompt('Base URL (optional):', 'https://api.example.com/v1') || '';
    addCustomProvider(name, baseUrl);
  };

  const handleSaveAll = () => {
    closeSettings();
    showToast('All settings saved');
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}
    >
      <div className="glass w-full max-w-6xl max-h-[92vh] rounded-3xl border border-surface-700 overflow-hidden flex flex-col modal" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-surface-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.572 1.065c1.755.426 1.755 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.572-1.065c-1.755-.426-1.755-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-xl">AI Provider Settings</div>
              <div className="text-xs text-gray-400">Manage providers, models & API keys • Stored locally in your browser</div>
            </div>
          </div>
          <button type="button" onClick={closeSettings} className="p-2 hover:bg-surface-700 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="glass rounded-3xl p-6 border border-surface-700">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-lg">Default Provider & Model</h2>
                <p className="text-sm text-gray-400">Used for new generations unless overridden per shot.</p>
              </div>
              <div className="w-full md:w-80">
                <select
                  value={ai.defaultProvider}
                  onChange={(e) => setDefaultProvider(e.target.value)}
                  className="w-full bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all select-arrow appearance-none"
                >
                  {BUILT_IN_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {ai.customProviders.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Custom)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-2xl tracking-tight">Built-in Providers</h2>
              <div className="text-xs px-3 py-1 rounded-full bg-surface-800 text-gray-400 border border-surface-700">
                {BUILT_IN_PROVIDERS.length} providers ready
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {BUILT_IN_PROVIDERS.map((p) => {
                const connected = isProviderConnected(p.id, false, ai);
                const conf = ai.configured[p.id];
                const masked = connected && conf?.apiKey ? `••••••${conf.apiKey.slice(-4)}` : '—';
                return (
                  <div key={p.id} className={`provider-card glass rounded-3xl p-5 border ${connected ? 'border-emerald-500/40' : 'border-surface-700'} flex flex-col`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-surface-700 flex items-center justify-center text-3xl flex-shrink-0 ring-1 ring-inset ring-white/5">{p.icon}</div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[15px] leading-tight">{p.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{p.desc.split('•')[0].trim()}</div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium ${connected ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20' : 'bg-gray-500/10 text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                        {connected ? 'Connected' : 'Not configured'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mb-auto line-clamp-2 leading-snug min-h-[32px]">{p.desc}</div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <div className="font-mono text-[10px] text-gray-500 truncate flex-1">{masked}</div>
                      <button
                        type="button"
                        onClick={() => openProviderEdit(p.id, false)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-2xl transition-all ${connected ? 'bg-surface-600 hover:bg-surface-500' : 'bg-brand-500 hover:bg-brand-600 text-white'}`}
                      >
                        {connected ? 'Edit' : 'Configure'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-2xl tracking-tight">Custom Providers</h2>
              <button
                type="button"
                onClick={handleAddCustom}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-2xl bg-surface-700 hover:bg-surface-600 border border-surface-600 transition-all"
              >
                Add Custom Provider
              </button>
            </div>
            {ai.customProviders.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">No custom providers yet. Add one above to support additional services.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ai.customProviders.map((p) => {
                  const connected = isProviderConnected(p.id, true, ai);
                  const masked = connected ? `••••••${p.apiKey.slice(-4)}` : '—';
                  return (
                    <div key={p.id} className={`provider-card glass rounded-3xl p-5 border ${connected ? 'border-emerald-500/40' : 'border-surface-700'} flex flex-col`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-surface-700 flex items-center justify-center text-3xl">🛠️</div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[15px]">{p.name} <span className="text-[9px] px-1.5 py-px rounded bg-surface-600 text-gray-400 font-mono">CUSTOM</span></div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                          {connected ? 'Connected' : 'Not configured'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-auto line-clamp-2 min-h-[32px]">{p.baseUrl ? p.baseUrl.replace(/^https?:\/\//, '') : 'No endpoint configured'}</div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="font-mono text-[10px] text-gray-500 truncate flex-1">{masked}</div>
                        <button
                          type="button"
                          onClick={() => openProviderEdit(p.id, true)}
                          className={`text-xs font-semibold px-4 py-1.5 rounded-2xl ${connected ? 'bg-surface-600 hover:bg-surface-500' : 'bg-brand-500 hover:bg-brand-600 text-white'}`}
                        >
                          {connected ? 'Edit' : 'Configure'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-surface-700 flex justify-end gap-3 flex-shrink-0">
          <button type="button" onClick={closeSettings} className="px-6 py-2.5 rounded-2xl border border-surface-600 hover:bg-surface-700 text-sm font-medium">Close</button>
          <button type="button" onClick={handleSaveAll} className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold">Save Changes</button>
        </div>
      </div>
    </div>
  );
}