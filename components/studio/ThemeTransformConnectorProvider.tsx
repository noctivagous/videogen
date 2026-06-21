'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import { useCharacterAssignmentConnector } from '@/components/studio/CharacterAssignmentConnector';
import { CharacterAssignmentLines } from '@/components/studio/CharacterAssignmentLines';
import { useThemeTransformConnector } from '@/components/studio/ThemeTransformConnector';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  getPrincipalMannequins,
  SUBJECT_LINK_COLORS,
  subjectLinkColorIndex,
} from '@/lib/studio/mannequin-character-assignment';
import { migrateMannequins } from '@/lib/studio/migrate-mannequin';
import { isBakeStartFrame } from '@/lib/studio/workflow';
import { needsThemeTransformer } from '@/lib/studio/theme-transform';
import { useStudioStore } from '@/store/useStudioStore';

export interface ThemeTransformConnectorContextValue {
  outletRef: RefObject<HTMLButtonElement | null>;
  slotRefs: MutableRefObject<(HTMLElement | null)[]>;
  startDrag: (e: React.PointerEvent<HTMLButtonElement>) => void;
  hoverSlot: number | null;
}

export interface CharacterAssignmentConnectorContextValue {
  subjectOutletRefs: MutableRefObject<Record<number, HTMLElement | null>>;
  registerMannequinAnchor: (mannequinId: string, el: HTMLElement | null) => void;
  setSubjectOutletRef: (slotIndex: number, el: HTMLElement | null) => void;
  startCharacterDrag: (e: React.PointerEvent, slotIndex: number) => void;
  draggingCharacterSlotIndex: number | null;
  hoverMannequinId: string | null;
  characterAssignmentEnabled: boolean;
  mannequinLinkRingClass: (slotIndex: number | undefined) => string;
  subjectSlotLinkClass: (slotIndex: number) => string;
  subjectOutletClass: (slotIndex: number) => string;
}

const ThemeTransformConnectorContext = createContext<ThemeTransformConnectorContextValue | null>(null);
const CharacterAssignmentConnectorContext =
  createContext<CharacterAssignmentConnectorContextValue | null>(null);

export function useThemeTransformConnectorContext(): ThemeTransformConnectorContextValue {
  const ctx = useContext(ThemeTransformConnectorContext);
  if (!ctx) {
    throw new Error('useThemeTransformConnectorContext must be used within ThemeTransformConnectorProvider');
  }
  return ctx;
}

export function useCharacterAssignmentConnectorContext(): CharacterAssignmentConnectorContextValue | null {
  return useContext(CharacterAssignmentConnectorContext);
}

export function ThemeTransformConnectorProvider({ children }: { children: ReactNode }) {
  const connectorContainerRef = useRef<HTMLDivElement>(null);
  const themeOutletRef = useRef<HTMLButtonElement>(null);
  const slotRefs = useRef<(HTMLElement | null)[]>([null, null, null]);
  const subjectOutletRefs = useRef<Record<number, HTMLElement | null>>({});
  const mannequinAnchorRefs = useRef<Record<string, HTMLElement | null>>({});

  const lighting = useStudioStore((s) => s.lighting);
  const frameView = useStudioStore((s) => s.frameView);
  const previewSubMode = useStudioStore((s) => s.previewSubMode);
  const applyThemeTransformSlot = useStudioStore((s) => s.applyThemeTransformSlot);
  const assignMannequinSubjectSlot = useStudioStore((s) => s.assignMannequinSubjectSlot);
  const shot = useStudioStore((s) => {
    const list = s.shots;
    return list.find((item) => item.id === s.currentShot) || list[0];
  });

  const mannequins = useMemo(() => migrateMannequins(shot?.mannequins), [shot?.mannequins]);
  const principalMannequinIds = useMemo(
    () => new Set(getPrincipalMannequins(mannequins).map((m) => m.id)),
    [mannequins],
  );

  const themeEnabled = needsThemeTransformer(lighting);
  const characterAssignmentEnabled =
    isBakeStartFrame(shot) && previewSubMode === 'framing' && frameView === 'preview';

  const onThemeConnect = useCallback(
    (slotIndex: number) => {
      void applyThemeTransformSlot(slotIndex);
    },
    [applyThemeTransformSlot],
  );

  const onCharacterConnect = useCallback(
    (slotIndex: number, mannequinId: string) => {
      assignMannequinSubjectSlot(mannequinId, slotIndex);
    },
    [assignMannequinSubjectSlot],
  );

  const { startDrag, connectorLine: themeConnectorLine, hoverSlot } = useThemeTransformConnector({
    containerRef: connectorContainerRef,
    outletRef: themeOutletRef,
    slotRefs,
    onConnect: onThemeConnect,
    enabled: themeEnabled && frameView === 'preview',
  });

  const {
    startCharacterDrag,
    connectorLine: characterDragLine,
    hoverMannequinId,
    draggingCharacterSlotIndex,
  } = useCharacterAssignmentConnector({
    containerRef: connectorContainerRef,
    subjectOutletRefs,
    mannequinAnchorRefs,
    principalMannequinIds,
    onConnect: onCharacterConnect,
    enabled: characterAssignmentEnabled,
  });

  const registerMannequinAnchor = useCallback((mannequinId: string, el: HTMLElement | null) => {
    if (el) mannequinAnchorRefs.current[mannequinId] = el;
    else delete mannequinAnchorRefs.current[mannequinId];
  }, []);

  const setSubjectOutletRef = useCallback((slotIndex: number, el: HTMLElement | null) => {
    if (el) subjectOutletRefs.current[slotIndex] = el;
    else delete subjectOutletRefs.current[slotIndex];
  }, []);

  const mannequinLinkRingClass = useCallback((slotIndex: number | undefined) => {
    if (slotIndex == null) return '';
    return SUBJECT_LINK_COLORS[subjectLinkColorIndex(slotIndex)].ring;
  }, []);

  const subjectSlotLinkClass = useCallback((slotIndex: number) => {
    return SUBJECT_LINK_COLORS[subjectLinkColorIndex(slotIndex)].slot;
  }, []);

  const subjectOutletClass = useCallback((slotIndex: number) => {
    return SUBJECT_LINK_COLORS[subjectLinkColorIndex(slotIndex)].outlet;
  }, []);

  return (
    <ThemeTransformConnectorContext.Provider
      value={{ outletRef: themeOutletRef, slotRefs, startDrag, hoverSlot }}
    >
      <CharacterAssignmentConnectorContext.Provider
        value={{
          subjectOutletRefs,
          registerMannequinAnchor,
          setSubjectOutletRef,
          startCharacterDrag,
          draggingCharacterSlotIndex,
          hoverMannequinId,
          characterAssignmentEnabled,
          mannequinLinkRingClass,
          subjectSlotLinkClass,
          subjectOutletClass,
        }}
      >
        <div
          ref={connectorContainerRef}
          className="theme-transform-connector-host relative flex flex-1 overflow-hidden min-h-0"
          {...uiSectionProps(UI_SECTIONS.studioWorkspace)}
        >
          <CharacterAssignmentLines
            containerRef={connectorContainerRef}
            slotRefs={slotRefs}
            mannequinAnchorRefs={mannequinAnchorRefs}
            shot={shot}
            mannequins={mannequins}
            enabled={characterAssignmentEnabled}
          />
          {themeConnectorLine}
          {characterDragLine}
          {children}
        </div>
      </CharacterAssignmentConnectorContext.Provider>
    </ThemeTransformConnectorContext.Provider>
  );
}