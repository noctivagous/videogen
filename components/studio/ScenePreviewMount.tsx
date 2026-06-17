'use client';

import { useEffect, useRef } from 'react';
import { createScenePreviewController } from '@/lib/studio/scene-preview';
import { useStudioStore } from '@/store/useStudioStore';

interface ScenePreviewMountProps {
  observeRef?: React.RefObject<HTMLElement | null>;
}

export function ScenePreviewMount({ observeRef }: ScenePreviewMountProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ReturnType<typeof createScenePreviewController> | null>(null);

  const project = useStudioStore((s) => s.project);
  const camera = useStudioStore((s) => s.camera);
  const lighting = useStudioStore((s) => s.lighting);
  const motion = useStudioStore((s) => s.motion);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);

  useEffect(() => {
    if (!mountRef.current) return;
    controllerRef.current = createScenePreviewController(
      mountRef.current,
      observeRef?.current,
    );
    return () => {
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, [observeRef]);

  useEffect(() => {
    const shot = shots.find((s) => s.id === currentShot) || shots[0];
    controllerRef.current?.sync({ project, camera, lighting, motion, shot });
  }, [project, camera, lighting, motion, shots, currentShot]);

  useEffect(() => {
    controllerRef.current?.resize();
  }, [project.aspectRatio]);

  return <div ref={mountRef} className="scene-mount absolute inset-0" />;
}