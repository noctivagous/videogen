'use client';

import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ManagedModal } from '@/components/ui/ModalManager';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { BUILT_IN_PROVIDERS } from '@/lib/constants/providers';
import { isProviderConnected, getProviderApiKey } from '@/lib/storage/ai-settings';
import { getLabByDirectProviderId } from '@/lib/constants/labs';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { useStudioStore } from '@/store/useStudioStore';

type Step = 0 | 1 | 2;

type TestState = 'idle' | 'testing' | 'success' | 'error';

type CardState = {
  apiKey: string;
  showKey: boolean;
  testState: TestState;
  testMessage: string | null;
};

const RECOMMENDED_AGGREGATORS = ['fal', 'replicate'] as const;
const OTHER_AGGREGATORS = ['together', 'huggingface', 'openrouter'] as const;
const INDIVIDUAL_PROVIDERS = [
  'runway', 'luma', 'kling', 'pika', 'stability', 'leonardo',
  'xai', 'minimax', 'viggle', 'hedra', 'openai',
] as const;

const STEP_LABELS = ['Recommended', 'Other Aggregators', 'Individual'] as const;
const STEP_SUBTITLES = [
  'Fal.ai and Replicate — the most popular aggregators',
  'Together AI, Hugging Face, and OpenRouter',
  'Direct providers with their own infrastructure',
] as const;

function ProviderConfigCard({
  providerId,
  isConnected,
  cardState,
  onTest,
}: {
  providerId: string;
  isConnected: boolean;
  cardState: CardState;
  onTest: (apiKey: string) => void;
}) {
  const builtIn = BUILT_IN_PROVIDERS.find((p) => p.id === providerId);
  const lab = getLabByDirectProviderId(providerId);
  if (!builtIn) return null;

  const tagline = lab?.tagline ?? builtIn.tagline;
  const [apiKey, setApiKey] = useState(cardState.apiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(cardState.apiKey);
  }, [cardState.apiKey]);

  return (
    <div className={`rounded-xl border h-full min-h-[440px] flex flex-col ${isConnected ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-surface-600 bg-surface-800/50'} p-4`}>
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-3 flex-shrink-0">
          <ProviderIcon providerId={providerId} fallbackIcon={builtIn.icon} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-100">{builtIn.name}</span>
              {isConnected && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" aria-hidden />
                  Connected
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{tagline}</div>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mt-3 flex-1">{builtIn.desc}</p>

        <div className="mt-auto flex flex-col gap-2 pt-3">
          {isConnected ? (
            <div className="rounded-lg bg-surface-700/50 px-3 py-2.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden />
              <span className="text-xs text-emerald-300">API key configured and verified</span>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-400">
                <span className="text-brand-400">ℹ︎</span> {builtIn.hint}
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key"
                  className="w-full bg-surface-700 border border-surface-600 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none font-mono placeholder:text-gray-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 caret-brand-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200"
                  aria-label={showKey ? 'Hide API key' : 'Show API key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {cardState.testMessage && (
                <div className={`rounded-lg px-3 py-2 text-xs ${cardState.testState === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                  {cardState.testMessage}
                </div>
              )}

              <button
                type="button"
                onClick={() => onTest(apiKey)}
                disabled={cardState.testState === 'testing' || !apiKey.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold hover:from-brand-400 hover:to-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cardState.testState === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    Testing…
                  </>
                ) : cardState.testState === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" aria-hidden />
                    Verified
                  </>
                ) : cardState.testState === 'error' ? (
                  <>
                    <Loader2 className="w-4 h-4" aria-hidden />
                    Try Again
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IndividualProviderCard({
  providerId,
  isConnected,
  cardState,
  onTest,
}: {
  providerId: string;
  isConnected: boolean;
  cardState: CardState;
  onTest: (apiKey: string) => void;
}) {
  const builtIn = BUILT_IN_PROVIDERS.find((p) => p.id === providerId);
  const lab = getLabByDirectProviderId(providerId);
  if (!builtIn) return null;

  const tagline = lab?.tagline ?? builtIn.tagline;
  const [apiKey, setApiKey] = useState(cardState.apiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(cardState.apiKey);
  }, [cardState.apiKey]);

  return (
    <div className={`rounded-lg border ${isConnected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-surface-600 bg-surface-800/40'} p-3 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <ProviderIcon providerId={providerId} fallbackIcon={builtIn.icon} size="sm" />
        <span className="font-medium text-sm text-gray-100">{builtIn.name}</span>
        {isConnected && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-auto" aria-hidden />
        )}
      </div>

      {isConnected ? (
        <div className="text-[10px] text-emerald-400 line-clamp-1">{tagline}</div>
      ) : (
        <>
          <div className="text-[10px] text-gray-500 line-clamp-1">{builtIn.hint}</div>
          <div className="flex gap-1.5">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API key"
              className="flex-1 bg-surface-700 border border-surface-600 rounded px-2 py-1.5 text-[10px] outline-none font-mono placeholder:text-gray-600 min-w-0 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 caret-brand-400"
            />
            <button
              type="button"
              onClick={() => onTest(apiKey)}
              disabled={cardState.testState === 'testing' || !apiKey.trim()}
              className="flex-shrink-0 px-2 py-1.5 rounded bg-brand-600 text-[10px] font-medium hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cardState.testState === 'testing' ? '…' : 'Test'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function WelcomeModal() {
  const welcomeModalOpen = useStudioStore((s) => s.welcomeModalOpen);
  const closeWelcomeModal = useStudioStore((s) => s.closeWelcomeModal);
  const ai = useStudioStore((s) => s.ai);
  const applyProviderTestResult = useStudioStore((s) => s.applyProviderTestResult);
  const showToast = useStudioStore((s) => s.showToast);

  const [step, setStep] = useState<Step>(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>(() => {
    const initial: Record<string, CardState> = {};
    const allProviders = [...RECOMMENDED_AGGREGATORS, ...OTHER_AGGREGATORS, ...INDIVIDUAL_PROVIDERS];
    for (const id of allProviders) {
      initial[id] = {
        apiKey: getProviderApiKey(id, false, ai),
        showKey: false,
        testState: 'idle',
        testMessage: null,
      };
    }
    return initial;
  });

  useEffect(() => {
    if (welcomeModalOpen) {
      const allProviders = [...RECOMMENDED_AGGREGATORS, ...OTHER_AGGREGATORS, ...INDIVIDUAL_PROVIDERS];
      setCardStates((prev) => {
        const next = { ...prev };
        for (const id of allProviders) {
          if (!next[id]) {
            next[id] = { apiKey: '', showKey: false, testState: 'idle', testMessage: null };
          } else {
            next[id] = { ...next[id], apiKey: getProviderApiKey(id, false, ai) };
          }
        }
        return next;
      });
    }
  }, [welcomeModalOpen, ai]);

  const handleApiKeyChange = useCallback((providerId: string, value: string) => {
    setCardStates((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], apiKey: value },
    }));
  }, []);

  const handleTest = useCallback(async (providerId: string, apiKey: string) => {
    if (!apiKey.trim()) {
      showToast('Enter an API key before testing', 'error');
      return;
    }

    setCardStates((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], testState: 'testing', testMessage: null },
    }));

    try {
      const res = await fetch('/api/providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, isCustom: false, apiKey }),
      });
      const result = (await res.json()) as ProviderTestResult;
      setCardStates((prev) => ({
        ...prev,
        [providerId]: {
          ...prev[providerId],
          testState: result.ok ? 'success' : 'error',
          testMessage: result.message,
        },
      }));
      applyProviderTestResult(providerId, false, result, apiKey);
      showToast(result.message, result.ok ? 'success' : 'error');
    } catch {
      const message = 'Connection test failed — check network and try again.';
      setCardStates((prev) => ({
        ...prev,
        [providerId]: { ...prev[providerId], testState: 'error', testMessage: message },
      }));
      showToast(message, 'error');
    }
  }, [cardStates, applyProviderTestResult, showToast]);

  const falConnected = isProviderConnected('fal', false, ai);
  const replicateConnected = isProviderConnected('replicate', false, ai);
  const hasRecommendedConnected = falConnected || replicateConnected;

  const handleFinished = () => {
    closeWelcomeModal();
  };

  const canProceedFromStep0 = hasRecommendedConnected;

  return (
    <ManagedModal
      open={welcomeModalOpen}
      onClose={closeWelcomeModal}
      variant="walkthrough"
      className="glass w-full max-w-4xl rounded-xl border border-surface-700 overflow-hidden flex flex-col modal"
      {...uiSectionProps(UI_SECTIONS.studioWelcomeModal)}
    >
      <div className="px-8 py-5 border-b border-surface-700 flex items-center justify-between flex-shrink-0">
        <div />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" aria-hidden />
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-100">Setup AI Providers</div>
            <div className="text-xs text-gray-400">{STEP_LABELS[step]} — {STEP_SUBTITLES[step]}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={closeWelcomeModal}
          className="p-2 hover:bg-surface-700 rounded-xl transition-all text-gray-400 hover:text-gray-200"
          aria-label="Close welcome modal"
        >
          <X className="w-5 h-5" aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {step === 0 && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-100 mb-1">Welcome to VideoGen</h2>
              <p className="text-sm text-gray-400">
                VideoGen uses AI providers to generate video. We recommend starting with{' '}
                <span className="text-gray-200 font-medium">aggregators</span> — they host many
                models behind a single API, giving you variety without managing multiple keys.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Fal.ai and Replicate are the most popular choices and will cover most use cases.
                Configure them below to get started.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {RECOMMENDED_AGGREGATORS.map((providerId) => (
                <ProviderConfigCard
                  key={providerId}
                  providerId={providerId}
                  isConnected={isProviderConnected(providerId, false, ai)}
                  cardState={cardStates[providerId]}
                  onTest={(apiKey) => handleTest(providerId, apiKey)}
                />
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <div className="grid grid-cols-3 gap-4">
{OTHER_AGGREGATORS.map((providerId) => (
                <ProviderConfigCard
                  key={providerId}
                  providerId={providerId}
                  isConnected={isProviderConnected(providerId, false, ai)}
                  cardState={cardStates[providerId]}
                  onTest={(apiKey) => handleTest(providerId, apiKey)}
                />
              ))}
          </div>
        )}

        {step === 2 && (
          <div className="h-[400px] overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-3">
              {INDIVIDUAL_PROVIDERS.map((providerId) => (
                <IndividualProviderCard
                  key={providerId}
                  providerId={providerId}
                  isConnected={isProviderConnected(providerId, false, ai)}
                  cardState={cardStates[providerId]}
                  onTest={(apiKey) => handleTest(providerId, apiKey)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-5 border-t border-surface-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-600 text-sm font-medium text-gray-300 hover:bg-surface-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={closeWelcomeModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden />
            Done
          </button>
        </div>

        <div className="flex items-center gap-3">
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold hover:from-brand-400 hover:to-brand-500 transition-all"
            >
              {step === 0 ? 'Other Aggregators' : 'Individual Providers'}
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={closeWelcomeModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold hover:from-brand-400 hover:to-brand-500 transition-all"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </ManagedModal>
  );
}