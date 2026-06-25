'use client';

import { InspectionManager } from '@/components/studio/inspection-manager/InspectionManager';
import {
  parseDerivedCharacterColorPaletteGroupAssetId,
} from '@/lib/media/color-palette-group';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioPanelInspectorStore } from '@/store/useStudioPanelInspectorStore';
import { useStudioStore } from '@/store/useStudioStore';

function parseDerivedCharacterSheetAssetId(assetId: string): { characterId: string; sheetId: string } | null {
  const match = /^derived:character-sheet:([^:]+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { characterId: match[1], sheetId: match[2] };
}

export function CharacterManagerInspectorPanel() {
  const selectedAssetId = useStudioPanelInspectorStore((s) => s.characterManagerSelectedAssetId);
  const setCharacterManagerSelection = useStudioPanelInspectorStore((s) => s.setCharacterManagerSelection);
  const selectShot = useStudioStore((s) => s.selectShot);
  const navigateToPanel = useNavigateToStudioPanel();

  return (
    <div className="h-full bg-surface-900/90">
      <InspectionManager
        selectedAssetId={selectedAssetId}
        onSelectAssetId={(assetId) => setCharacterManagerSelection(null, assetId)}
        registrations={[
          {
            parseAssetId: parseDerivedCharacterSheetAssetId,
            onMatch: (parsed) => {
              const match = parsed as { characterId: string; sheetId: string };
              setCharacterManagerSelection(match.characterId, `derived:character-sheet:${match.characterId}:${match.sheetId}`);
            },
          },
          {
            parseAssetId: parseDerivedCharacterColorPaletteGroupAssetId,
            onMatch: (parsed) => {
              const match = parsed as { characterId: string; collectionId: string };
              const assetId = `derived:color-palette-group:character:${match.characterId}:${match.collectionId}`;
              setCharacterManagerSelection(match.characterId, assetId);
            },
          },
        ]}
        emptyMessage="Select a character asset to inspect details."
        onGoToShot={(shotId) => {
          selectShot(shotId);
          navigateToPanel('shot-designer');
        }}
      />
    </div>
  );
}
