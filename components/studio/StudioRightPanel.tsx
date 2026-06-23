'use client';

import { LightingPanel } from '@/components/studio/LightingPanel';
import { PoseBlockPanel } from '@/components/studio/PoseBlockPanel';
import { usesMannequinBlockingPanel } from '@/lib/studio/mannequin-blocking-panel';
import { useStudioStore } from '@/store/useStudioStore';

export function StudioRightPanel() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const previewSubMode = useStudioStore((s) => s.previewSubMode);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const showMannequinPanel = usesMannequinBlockingPanel(shot, previewSubMode);

  if (showMannequinPanel) {
    return (
      <>
        <PoseBlockPanel />
        <div className="border-t border-surface-700">
          <LightingPanel />
        </div>
      </>
    );
  }

  return <LightingPanel />;
}
