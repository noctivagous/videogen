import * as THREE from 'three';
import { createStage, getStage } from 'mannequin-js/src/mannequin.js';
import {
  renderer,
  scene,
  camera,
  light,
  clock,
} from 'mannequin-js/src/scene.js';
import { applyCameraFromState, applyLightingFromState } from '@/lib/studio/camera-mapper';
import {
  getFigureCount,
  createFigure,
  layoutFigures,
  disposeFigure,
} from '@/lib/studio/blocking-poses';
import type { ScenePreviewPayload } from '@/lib/types/studio';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Figure = any;

export interface ScenePreviewController {
  sync: (payload: ScenePreviewPayload) => void;
  resize: () => void;
  dispose: () => void;
}

export function createScenePreviewController(
  mountEl: HTMLElement,
  observeEl?: HTMLElement | null,
): ScenePreviewController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let figures: Figure[] = [];
  let lastPayload: ScenePreviewPayload | null = null;
  let resizeObserver: ResizeObserver | null = null;

  createStage();
  const stage = getStage();
  if (stage.controls) {
    stage.controls.enabled = false;
  }

  renderer.setAnimationLoop(renderLoop);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const canvas = renderer.domElement;
  canvas.remove();
  canvas.style.cssText = 'width:100%;height:100%;display:block;position:absolute;top:0;left:0;';
  mountEl.appendChild(canvas);

  scene.background = new THREE.Color(0x1c1c21);

  function resize() {
    const width = mountEl.clientWidth;
    const height = mountEl.clientHeight;
    if (width === 0 || height === 0) return;

    renderer.setSize(width, height, false);
    if (lastPayload) {
      applyCameraFromState(camera, lastPayload);
    } else {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }

  function ensureFigures(count: number) {
    while (figures.length > count) {
      const removed = figures.pop();
      if (removed) disposeFigure(removed, scene);
    }

    while (figures.length < count) {
      figures.push(createFigure(figures.length, count));
    }
  }

  function sync(payload: ScenePreviewPayload) {
    if (!payload) return;
    lastPayload = payload;

    const count = getFigureCount(payload.camera);
    ensureFigures(count);
    layoutFigures(figures, payload, clock.getElapsedTime());
    applyCameraFromState(camera, payload);
    applyLightingFromState(light, scene, payload.lighting);
    resize();
  }

  function renderLoop() {
    if (lastPayload) {
      layoutFigures(figures, lastPayload, clock.getElapsedTime());
    }
    renderer.render(scene, camera);
  }

  const target = observeEl || mountEl;
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(target);
  resize();

  return {
    sync,
    resize,
    dispose() {
      resizeObserver?.disconnect();
      figures.forEach((f) => disposeFigure(f, scene));
      figures = [];
      renderer.setAnimationLoop(null);
      canvas.remove();
    },
  };
}