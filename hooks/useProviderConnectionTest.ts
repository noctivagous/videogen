'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProviderTestResult } from '@/lib/studio/generation/types';
import { useStudioStore } from '@/store/useStudioStore';

export type ProviderConnectionTestUi = 'idle' | 'testing' | 'success' | 'error';

export interface ProviderConnectionTestState {
  ui: ProviderConnectionTestUi;
  message: string | null;
  detail: string | null;
  modelCount: number;
}

const INITIAL: ProviderConnectionTestState = {
  ui: 'idle',
  message: null,
  detail: null,
  modelCount: 0,
};

function progressSteps(providerName: string): string[] {
  return [
    `Connecting to ${providerName}…`,
    'Verifying your API key…',
    'Fetching available models…',
    'Finishing up…',
  ];
}

function resultDetail(result: ProviderTestResult): string | null {
  const modelCount = result.models?.length ?? 0;
  const latency =
    result.latencyMs != null ? `Responded in ${(result.latencyMs / 1000).toFixed(1)}s` : null;
  if (latency && modelCount > 0) {
    return `${latency} · ${modelCount} model${modelCount === 1 ? '' : 's'} found`;
  }
  if (latency) return latency;
  if (modelCount > 0) return `${modelCount} model${modelCount === 1 ? '' : 's'} found`;
  return null;
}

export function useProviderConnectionTest(providerName: string) {
  const applyProviderTestResult = useStudioStore((s) => s.applyProviderTestResult);
  const showToast = useStudioStore((s) => s.showToast);
  const [state, setState] = useState<ProviderConnectionTestState>(INITIAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepIndexRef = useRef(0);

  const clearProgressTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearProgressTimer(), [clearProgressTimer]);

  const startProgress = useCallback(() => {
    const steps = progressSteps(providerName);
    stepIndexRef.current = 0;
    setState({
      ui: 'testing',
      message: steps[0],
      detail: 'This may take a few seconds.',
      modelCount: 0,
    });
    intervalRef.current = setInterval(() => {
      stepIndexRef.current = Math.min(stepIndexRef.current + 1, steps.length - 1);
      setState((prev) => ({
        ...prev,
        message: steps[stepIndexRef.current],
      }));
    }, 1400);
  }, [providerName]);

  const runTest = useCallback(
    async (params: {
      providerId: string;
      isCustom: boolean;
      apiKey: string;
      customBaseUrl?: string;
      silentToast?: boolean;
    }): Promise<ProviderTestResult | null> => {
      clearProgressTimer();
      startProgress();

      try {
        const res = await fetch('/api/providers/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: params.providerId,
            isCustom: params.isCustom,
            apiKey: params.apiKey,
            customBaseUrl: params.customBaseUrl,
          }),
        });
        const result = (await res.json()) as ProviderTestResult;
        clearProgressTimer();

        const modelCount = result.models?.length ?? 0;
        setState({
          ui: result.ok ? 'success' : 'error',
          message: result.message,
          detail: resultDetail(result),
          modelCount,
        });

        applyProviderTestResult(params.providerId, params.isCustom, result, params.apiKey);
        if (!params.silentToast) {
          showToast(result.message, result.ok ? 'success' : 'error');
        }
        return result;
      } catch {
        clearProgressTimer();
        const message = 'Connection test failed — check network and try again.';
        setState({ ui: 'error', message, detail: null, modelCount: 0 });
        applyProviderTestResult(
          params.providerId,
          params.isCustom,
          { ok: false, message },
          params.apiKey,
        );
        if (!params.silentToast) showToast(message, 'error');
        return null;
      }
    },
    [applyProviderTestResult, clearProgressTimer, showToast, startProgress],
  );

  const reset = useCallback(() => {
    clearProgressTimer();
    setState(INITIAL);
  }, [clearProgressTimer]);

  const hydrateFromDiscovery = useCallback(
    (lastTestOk: boolean | undefined, lastTestMessage: string | undefined, modelCount: number) => {
      if (!lastTestMessage) return;
      setState({
        ui: lastTestOk ? 'success' : 'error',
        message: lastTestMessage,
        detail: modelCount > 0 ? `${modelCount} model${modelCount === 1 ? '' : 's'} cataloged` : null,
        modelCount,
      });
    },
    [],
  );

  return { state, runTest, reset, hydrateFromDiscovery };
}
