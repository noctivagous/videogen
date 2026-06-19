'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import { useThemeTransformConnector } from '@/components/studio/ThemeTransformConnector';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { needsThemeTransformer } from '@/lib/studio/theme-transform';
import { useStudioStore } from '@/store/useStudioStore';

export interface ThemeTransformConnectorContextValue {
  outletRef: RefObject<HTMLButtonElement | null>;
  inletRefs: MutableRefObject<(HTMLElement | null)[]>;
  startDrag: (e: React.PointerEvent<HTMLButtonElement>) => void;
  hoverInlet: number | null;
}

const ThemeTransformConnectorContext = createContext<ThemeTransformConnectorContextValue | null>(null);

export function useThemeTransformConnectorContext(): ThemeTransformConnectorContextValue {
  const ctx = useContext(ThemeTransformConnectorContext);
  if (!ctx) {
    throw new Error('useThemeTransformConnectorContext must be used within ThemeTransformConnectorProvider');
  }
  return ctx;
}

export function ThemeTransformConnectorProvider({ children }: { children: ReactNode }) {
  const connectorContainerRef = useRef<HTMLDivElement>(null);
  const themeOutletRef = useRef<HTMLButtonElement>(null);
  const inletRefs = useRef<(HTMLElement | null)[]>([null, null, null]);
  const lighting = useStudioStore((s) => s.lighting);
  const frameView = useStudioStore((s) => s.frameView);
  const applyThemeTransformSlot = useStudioStore((s) => s.applyThemeTransformSlot);

  const themeEnabled = needsThemeTransformer(lighting);
  const onThemeConnect = useCallback(
    (slotIndex: number) => {
      void applyThemeTransformSlot(slotIndex);
    },
    [applyThemeTransformSlot],
  );

  const { startDrag, connectorLine, hoverInlet } = useThemeTransformConnector({
    containerRef: connectorContainerRef,
    outletRef: themeOutletRef,
    inletRefs,
    onConnect: onThemeConnect,
    enabled: themeEnabled && frameView === 'preview',
  });

  return (
    <ThemeTransformConnectorContext.Provider
      value={{ outletRef: themeOutletRef, inletRefs, startDrag, hoverInlet }}
    >
      <div
        ref={connectorContainerRef}
        className="theme-transform-connector-host relative flex flex-1 overflow-hidden min-h-0"
        {...uiSectionProps(UI_SECTIONS.studioWorkspace)}
      >
        {connectorLine}
        {children}
      </div>
    </ThemeTransformConnectorContext.Provider>
  );
}