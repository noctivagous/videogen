'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getBackdropReference } from '@/lib/constants/stock-demo';
import {
  applyCameraFromState,
  applyLightingFromState,
  measureFigureBounds,
} from '@/lib/studio/camera-mapper';
import {
  createFigure,
  disposeFigure,
  getFigureCount,
  layoutFigures,
} from '@/lib/studio/blocking-poses';
import type { HumanoidFigure } from '@/lib/studio/humanoid/types';
import type { ScenePreviewPayload } from '@/lib/types/studio';

interface StudioSceneProps {
  payload: ScenePreviewPayload;
}

const STUDIO_BG = 0x2e2e2e;
const STUDIO_FLOOR = 0x242424;

function isRasterBackdropUrl(url: string): boolean {
  if (url.startsWith('data:image/svg')) return false;
  return /\.(png|jpe?g|webp|gif|bmp|avif)(\?|#|$)/i.test(url)
    || /^data:image\/(png|jpe?g|webp|gif|bmp|avif)/i.test(url);
}

function BackdropPlane({ url }: { url: string }) {
  const texture = useLoader(THREE.TextureLoader, url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <mesh position={[0, 1.2, -8]} scale={[16, 9, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function StudioScene({ payload }: StudioSceneProps) {
  const figuresRef = useRef<HumanoidFigure[]>([]);
  const figuresGroupRef = useRef<THREE.Group>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const lastDebugRef = useRef<Record<string, unknown> | null>(null);
  const { scene, camera, size } = useThree();

  const figureCount = useMemo(
    () => getFigureCount(payload.camera),
    [payload.camera],
  );

  const backdropUrl = getBackdropReference(payload.shot);
  const rasterBackdrop = backdropUrl && isRasterBackdropUrl(backdropUrl) ? backdropUrl : null;

  useEffect(() => {
    scene.background = new THREE.Color(STUDIO_BG);
  }, [scene]);

  useEffect(() => {
    const group = figuresGroupRef.current;
    if (!group) return;

    while (figuresRef.current.length > figureCount) {
      const removed = figuresRef.current.pop();
      if (removed) disposeFigure(removed, group);
    }

    while (figuresRef.current.length < figureCount) {
      const fig = createFigure(figuresRef.current.length, figureCount);
      group.add(fig);
      figuresRef.current.push(fig);
    }
  }, [figureCount]);

  useFrame((state) => {
    const figures = figuresRef.current;
    layoutFigures(figures, payload, state.clock.elapsedTime);
    applyLightingFromState(dirLightRef.current, scene, payload.lighting);

    const aspect = size.width / Math.max(size.height, 1);
    const bounds = measureFigureBounds(figures);
    lastDebugRef.current = applyCameraFromState(
      camera as THREE.PerspectiveCamera,
      payload,
      aspect,
      bounds,
    );

    if (typeof window !== 'undefined') {
      window.__sceneDebug = {
        camera: {
          position: camera.position.toArray(),
          fov: (camera as THREE.PerspectiveCamera).fov,
          aspect,
        },
        framing: lastDebugRef.current,
        bounds,
        figures: figures.map((f) => ({
          scale: f.scale?.y,
          targetHeight: f.userData?.targetHeight,
          position: f.position?.toArray?.() ?? null,
          boneCount: Object.keys(f.userData?.bones ?? {}).length,
        })),
        mount: { w: size.width, h: size.height },
      };
    }
  });

  return (
    <>
      {rasterBackdrop && <BackdropPlane url={rasterBackdrop} />}
      <ambientLight intensity={0.4} />
      <directionalLight ref={dirLightRef} position={[4, 8, 6]} intensity={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.71, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={`#${STUDIO_FLOOR.toString(16).padStart(6, '0')}`} roughness={0.95} />
      </mesh>
      <group ref={figuresGroupRef} />
    </>
  );
}

interface ScenePreviewCanvasProps {
  payload: ScenePreviewPayload;
}

export function ScenePreviewCanvas({ payload }: ScenePreviewCanvasProps) {
  return (
    <Canvas
      className="absolute inset-0"
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      camera={{ fov: 27, near: 0.1, far: 200, position: [0, 1, 8] }}
    >
      <Suspense fallback={null}>
        <StudioScene payload={payload} />
      </Suspense>
    </Canvas>
  );
}