'use client';

import { useEffect, type ReactNode } from 'react';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { launchStudioLauncherItem } from '@/lib/studio/launch-studio-launcher-item';
import {
  getAdjacentLauncherItemForPanel,
  getLauncherItemForShortcutKey,
} from '@/lib/studio/studio-launcher-keybindings';
import {
  handleKeydown,
  matchAltArrowKeydown,
  matchAltShortcutKeydown,
  registerKeybinding,
  unregisterKeybinding,
} from '@/lib/ui/keybindings';
import { useStudioStore } from '@/store/useStudioStore';

const STUDIO_LAUNCHER_KEYBINDING_ID = 'studio-launcher-alt-digit';
const STUDIO_LAUNCHER_ARROW_KEYBINDING_ID = 'studio-launcher-alt-arrow';

function useStudioLauncherKeybindings(): void {
  const navigateToPanel = useNavigateToStudioPanel();

  useEffect(() => {
    registerKeybinding({
      id: STUDIO_LAUNCHER_KEYBINDING_ID,
      match: (event) => {
        const shortcut = matchAltShortcutKeydown(event);
        if (!shortcut) return false;
        return getLauncherItemForShortcutKey(shortcut) !== null;
      },
      handler: (event) => {
        const shortcut = matchAltShortcutKeydown(event);
        if (!shortcut) return;

        const itemId = getLauncherItemForShortcutKey(shortcut);
        if (!itemId) return;

        event.preventDefault();
        launchStudioLauncherItem(itemId, {
          navigateToPanel,
          showToast: useStudioStore.getState().showToast,
        });
      },
    });

    registerKeybinding({
      id: STUDIO_LAUNCHER_ARROW_KEYBINDING_ID,
      match: (event) => matchAltArrowKeydown(event) !== null,
      handler: (event) => {
        const shortcut = matchAltArrowKeydown(event);
        if (!shortcut) return;

        const direction = shortcut.endsWith('arrowleft') ? 'previous' : 'next';
        const state = useStudioStore.getState();
        const itemId = getAdjacentLauncherItemForPanel(state.workspaceView, direction);
        if (!itemId) return;

        event.preventDefault();
        launchStudioLauncherItem(itemId, {
          navigateToPanel,
          showToast: state.showToast,
        });
      },
    });

    return () => {
      unregisterKeybinding(STUDIO_LAUNCHER_KEYBINDING_ID);
      unregisterKeybinding(STUDIO_LAUNCHER_ARROW_KEYBINDING_ID);
    };
  }, [navigateToPanel]);
}

interface KeybindingsManagerProps {
  children: ReactNode;
}

export function KeybindingsManager({ children }: KeybindingsManagerProps) {
  useStudioLauncherKeybindings();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (handleKeydown(event)) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return children;
}
