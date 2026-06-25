'use client';

import { StudioRightPanel } from '@/components/studio/StudioRightPanel';
import { CharacterManagerInspectorPanel } from '@/components/studio/character-manager/CharacterManagerInspectorPanel';
import { LocationManagerInspectorPanel } from '@/components/studio/location-manager/LocationManagerInspectorPanel';
import { MediaLibraryRightInspectorPanel } from '@/components/studio/media-library/MediaLibraryRightInspectorPanel';
import type { StudioPanelId } from '@/lib/studio/studio-routes';

export function StudioWorkspaceRightPanel({ panel }: { panel: StudioPanelId }) {
  if (panel === 'shot-designer') {
    return <StudioRightPanel />;
  }

  if (panel === 'media-library') {
    return <MediaLibraryRightInspectorPanel />;
  }

  if (panel === 'character-sheet-generator') {
    return <CharacterManagerInspectorPanel />;
  }

  if (panel === 'location-manager') {
    return <LocationManagerInspectorPanel />;
  }

  return null;
}
