'use client';

import { useMemo } from 'react';
import { ScenePreviewCanvas } from '@/components/studio/ScenePreviewCanvas';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { useStudioStore } from '@/store/useStudioStore';

export function ScenePreviewMount() {
  const project = useStudioStore((s) => s.project);
  const camera = useStudioStore((s) => s.camera);
  const lighting = useStudioStore((s) => s.lighting);
  const motion = useStudioStore((s) => s.motion);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];

  const payload = useMemo(
    () => ({ project, camera, lighting, motion, shot }),
    [project, camera, lighting, motion, shot],
  );

  return (
    <div className="scene-mount absolute inset-0" {...uiSectionProps(UI_SECTIONS.studioPreview3dScene)}>
      <ScenePreviewCanvas payload={payload} />
    </div>
  );
}