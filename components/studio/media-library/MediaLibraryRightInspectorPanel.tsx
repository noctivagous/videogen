'use client';

import { MediaLibraryInspector } from '@/components/studio/media-library/MediaLibraryInspector';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';
import { deriveProjectAssets, mergeWithDerivedAssets } from '@/lib/media/derive-project-assets';
import { mergeMediaLibraries } from '@/lib/media/media-library-mutations';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

export function MediaLibraryRightInspectorPanel() {
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const globalMediaLibrary = useStudioStore((s) => s.globalMediaLibrary);
  const setups = useStudioStore((s) => s.setups);
  const characters = useStudioStore((s) => s.characters);
  const locations = useStudioStore((s) => s.locations);
  const shots = useStudioStore((s) => s.shots);
  const snapshots = useStudioStore((s) => s.shotWorkflowSnapshots);
  const selectedId = useStudioStore((s) => s.selectedMediaLibraryItemId);
  const selectMediaLibraryItem = useStudioStore((s) => s.selectMediaLibraryItem);
  const selectShot = useStudioStore((s) => s.selectShot);
  const navigateToPanel = useNavigateToStudioPanel();

  const derivedAssets = deriveProjectAssets(setups, characters, locations);
  const projectAssets = mergeWithDerivedAssets(mediaLibrary, derivedAssets);
  const allAssets = mergeMediaLibraries(projectAssets, globalMediaLibrary);

  return (
    <div className="h-full" {...uiSectionProps(UI_SECTIONS.studioMediaLibraryInspector)}>
      <MediaLibraryInspector
        selectedId={selectedId}
        assets={allAssets}
        snapshots={snapshots}
        shots={shots}
        onSelectAsset={selectMediaLibraryItem}
        onGoToShot={(shotId) => {
          selectShot(shotId);
          navigateToPanel('shot-designer');
        }}
      />
    </div>
  );
}
