'use client';

import { InspectionManager } from '@/components/studio/inspection-manager/InspectionManager';
import {
  parseDerivedLocationColorPaletteGroupAssetId,
} from '@/lib/media/color-palette-group';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { useStudioPanelInspectorStore } from '@/store/useStudioPanelInspectorStore';
import { useStudioStore } from '@/store/useStudioStore';

function parseDerivedLocationPlateAssetId(assetId: string): { locationId: string; plateId: string } | null {
  const match = /^derived:location-plate:([^:]+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { locationId: match[1], plateId: match[2] };
}

export function LocationManagerInspectorPanel() {
  const selectedAssetId = useStudioPanelInspectorStore((s) => s.locationManagerSelectedAssetId);
  const setLocationManagerSelection = useStudioPanelInspectorStore((s) => s.setLocationManagerSelection);
  const selectShot = useStudioStore((s) => s.selectShot);
  const navigateToPanel = useNavigateToStudioPanel();

  return (
    <div className="h-full bg-surface-900/90">
      <InspectionManager
        selectedAssetId={selectedAssetId}
        onSelectAssetId={(assetId) => setLocationManagerSelection(null, assetId)}
        registrations={[
          {
            parseAssetId: parseDerivedLocationPlateAssetId,
            onMatch: (parsed) => {
              const match = parsed as { locationId: string; plateId: string };
              setLocationManagerSelection(match.locationId, `derived:location-plate:${match.locationId}:${match.plateId}`);
            },
          },
          {
            parseAssetId: parseDerivedLocationColorPaletteGroupAssetId,
            onMatch: (parsed) => {
              const match = parsed as { locationId: string; collectionId: string };
              const assetId = `derived:color-palette-group:location:${match.locationId}:${match.collectionId}`;
              setLocationManagerSelection(match.locationId, assetId);
            },
          },
        ]}
        emptyMessage="Select a location asset to inspect details."
        onGoToShot={(shotId) => {
          selectShot(shotId);
          navigateToPanel('shot-designer');
        }}
      />
    </div>
  );
}
