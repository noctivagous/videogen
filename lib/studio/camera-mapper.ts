import * as THREE from 'three';
import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import type { FrameComposition, ScenePreviewPayload } from '@/lib/types/studio';
import type { PerspectiveCamera } from 'three';

const FIELD_SIZE_DISTANCE: Record<string, number> = {
  ecu: 0.85, cu: 1.2, mcu: 1.6, 'close-shot': 1.8, ms: 2.4, fs: 4.5,
  ls: 7, els: 10, vls: 11, ws: 8, mws: 3.2, bcu: 1.0, xls: 10,
  cowboy: 2.8, ch: 0.95, gv: 9,
};

const PLACEMENT_OFFSETS: Record<string, { x: number; z: number }> = {
  'top-left': { x: -0.55, z: 0.35 },
  'top-center': { x: 0, z: 0.35 },
  'top-right': { x: 0.55, z: 0.35 },
  'middle-left': { x: -0.55, z: 0 },
  center: { x: 0, z: 0 },
  'middle-right': { x: 0.55, z: 0 },
  'bottom-left': { x: -0.55, z: -0.35 },
  'bottom-center': { x: 0, z: -0.35 },
  'bottom-right': { x: 0.55, z: -0.35 },
};

const ANGLE_PRESETS: Record<string, { camY: number; targetY: number; pitch: number; roll?: number }> = {
  'eye-level': { camY: 1.55, targetY: 1.4, pitch: 0 },
  'high-angle': { camY: 2.6, targetY: 1.1, pitch: -18 },
  'low-angle': { camY: 0.55, targetY: 1.55, pitch: 12 },
  'birds-eye': { camY: 6.5, targetY: 0, pitch: -72 },
  'worms-eye': { camY: 0.25, targetY: 1.65, pitch: 22 },
  dutch: { camY: 1.55, targetY: 1.4, pitch: 0, roll: 14 },
};

const HEADROOM_TARGET_Y: Record<string, number> = {
  tight: 1.25,
  normal: 1.4,
  generous: 1.55,
};

const LENS_FOV_SCALE: Record<string, number> = {
  wide: 1.35,
  standard: 1,
  telephoto: 0.72,
  macro: 0.55,
  fisheye: 1.85,
  anamorphic: 0.95,
};

function focalLengthToFov(focalLength: number): number {
  return 2 * Math.atan(12 / focalLength) * (180 / Math.PI);
}

function kelvinToRgb(kelvin: number): { r: number; g: number; b: number } {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
    b = temp <= 19 ? 0 : Math.min(255, Math.max(0, 138.5178227531 * Math.log(temp - 10) - 305.0447927307));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    b = 255;
  }

  return { r: r / 255, g: g / 255, b: b / 255 };
}

export function getPlacementOffset(frameComposition?: FrameComposition) {
  const placement = frameComposition?.placement || 'center';
  return PLACEMENT_OFFSETS[placement] || PLACEMENT_OFFSETS.center;
}

export function applyCameraFromState(threeCamera: PerspectiveCamera, payload: ScenePreviewPayload) {
  const { camera: cam, shot } = payload;
  const frame = shot?.frameComposition || DEFAULT_FRAME_COMPOSITION;
  const angle = ANGLE_PRESETS[cam.angle] || ANGLE_PRESETS['eye-level'];
  const distance = FIELD_SIZE_DISTANCE[cam.fieldSize] || FIELD_SIZE_DISTANCE.ms;
  const placement = getPlacementOffset(frame);

  let fov = focalLengthToFov(cam.focalLength || 50);
  fov *= LENS_FOV_SCALE[cam.lensType] || 1;
  fov = Math.min(Math.max(fov, 12), 110);

  const targetY = HEADROOM_TARGET_Y[frame.headroom] || HEADROOM_TARGET_Y.normal;
  const target = { x: placement.x, y: targetY, z: placement.z };

  let camX = placement.x * 0.15;
  let camY = angle.camY;
  let camZ = distance;
  let lookX = target.x;
  let lookY = angle.targetY ?? targetY;
  const lookZ = target.z;

  if (cam.coverage === 'ots') {
    camX = -0.45;
    camZ = distance * 0.85;
    lookX = 0.35;
    lookY = 1.45;
  } else if (cam.coverage === 'pov') {
    camY = 1.6;
    camZ = 0.15;
    lookX = 0;
    lookY = 1.55;
  }

  const pitchRad = (angle.pitch || 0) * (Math.PI / 180);
  camY += Math.sin(pitchRad) * distance * 0.08;
  lookY += Math.sin(pitchRad) * 0.25;

  threeCamera.fov = fov;
  threeCamera.position.set(camX, camY, camZ);
  threeCamera.lookAt(lookX, lookY, lookZ);

  if (cam.angle === 'dutch' && angle.roll) {
    threeCamera.rotation.z = angle.roll * (Math.PI / 180);
  } else {
    threeCamera.rotation.z = 0;
  }

  const aspect = parseAspect(payload.project?.aspectRatio || '16:9');
  threeCamera.aspect = aspect;
  threeCamera.updateProjectionMatrix();

  return { target, distance, fov };
}

function parseAspect(ar: string): number {
  const [w, h] = String(ar).split(':').map(Number);
  if (!w || !h) return 16 / 9;
  return w / h;
}

export function applyLightingFromState(
  directionalLight: THREE.DirectionalLight | null,
  scene: THREE.Scene,
  lighting: ScenePreviewPayload['lighting'],
) {
  if (!directionalLight || !lighting) return;

  const rgb = kelvinToRgb(lighting.colorTemp || 5500);
  const intensity = (lighting.intensity || 80) / 100;

  directionalLight.color.setRGB(rgb.r, rgb.g, rgb.b);
  directionalLight.intensity = 1.5 + intensity * 2;
  directionalLight.position.set(2, 4 + intensity, 3).setLength(12);

  const timeColors: Record<string, number> = {
    dawn: 0x6b4a68,
    morning: 0xc9b896,
    noon: 0x1c1c21,
    afternoon: 0x8b7355,
    sunset: 0x4a2c2a,
    night: 0x0a0a12,
  };

  const bg = timeColors[lighting.timeOfDay] || 0x1c1c21;
  scene.background = new THREE.Color(bg);

  scene.fog = null;
  if (lighting.atmosphere === 'foggy' || lighting.atmosphere === 'misty') {
    scene.fog = new THREE.FogExp2(bg, lighting.atmosphere === 'misty' ? 0.08 : 0.04);
  }

  const ambient = scene.children.find(
    (c): c is THREE.AmbientLight => (c as THREE.AmbientLight).isAmbientLight,
  );
  if (ambient) {
    ambient.intensity = 0.25 + intensity * 0.45;
    ambient.color.setRGB(rgb.r, rgb.g, rgb.b);
  }
}