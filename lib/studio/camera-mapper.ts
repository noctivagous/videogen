import * as THREE from 'three';
import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { FIELD_SIZE_FRAMING } from '@/lib/constants/framing';
import type { FrameComposition, ScenePreviewPayload } from '@/lib/types/studio';
import type { Object3D, PerspectiveCamera } from 'three';

const PLACEMENT_OFFSETS: Record<string, { x: number; z: number }> = {
  'top-left': { x: -0.55, z: 0.35 },
  'top-center': { x: 0, z: 0.35 },
  'top-right': { x: 0.55, z: 0.35 },
  'middle-left': { x: -0.55, z: 0 },
  center: { x: 0, z: 0 },
  'middle-right': { x: 0.55, z: 0 },
  'bottom-left': { x: -0.55, z: -0.35 },
  'bottom-center': { x: 0, z: -0.35 },
  'bottom-right': { x: 0.55, z: 0.35 },
};

const ANGLE_PRESETS: Record<string, { camAim: number; targetAim: number; pitch: number; roll?: number }> = {
  'eye-level': { camAim: 0.82, targetAim: 0.6, pitch: 0 },
  'high-angle': { camAim: 0.95, targetAim: 0.52, pitch: -14 },
  'low-angle': { camAim: 0.35, targetAim: 0.68, pitch: 10 },
  'birds-eye': { camAim: 1.6, targetAim: 0.4, pitch: -52 },
  'worms-eye': { camAim: 0.1, targetAim: 0.75, pitch: 16 },
  dutch: { camAim: 0.82, targetAim: 0.6, pitch: 0, roll: 14 },
};

const HEADROOM_OFFSET: Record<string, number> = {
  tight: -0.04,
  normal: 0,
  generous: 0.06,
};

const LENS_FOV_SCALE: Record<string, number> = {
  wide: 1.15,
  standard: 1,
  telephoto: 0.82,
  macro: 0.68,
  fisheye: 1.35,
  anamorphic: 0.92,
};

const SENSOR_HEIGHT_MM = 24;
const DISTANCE_PULLBACK = 1.25;
export interface FigureBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  height: number;
  center: { x: number; y: number; z: number };
}

const _box = new THREE.Box3();

export function measureFigureBounds(figures: Object3D[]): FigureBounds | null {
  const visible = figures.filter((f) => f.visible !== false);
  if (!visible.length) return null;

  _box.makeEmpty();
  for (const fig of visible) {
    _box.expandByObject(fig);
  }

  if (_box.isEmpty()) return null;

  const { min, max } = _box;
  const height = Math.max(max.y - min.y, 1);
  return {
    min: { x: min.x, y: min.y, z: min.z },
    max: { x: max.x, y: max.y, z: max.z },
    height,
    center: {
      x: (min.x + max.x) / 2,
      y: min.y + height / 2,
      z: (min.z + max.z) / 2,
    },
  };
}

function focalLengthToVerticalFov(focalLength: number): number {
  return 2 * Math.atan(SENSOR_HEIGHT_MM / (2 * focalLength)) * (180 / Math.PI);
}

function distanceForFraming(spanM: number, fill: number, fovDeg: number): number {
  const effectiveSpan = spanM / Math.max(fill, 0.15);
  const dist = effectiveSpan / (2 * Math.tan((fovDeg * Math.PI) / 360));
  return dist * DISTANCE_PULLBACK;
}

function aimY(bounds: FigureBounds, fraction: number, headroom = 0): number {
  return bounds.min.y + bounds.height * fraction + bounds.height * headroom;
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

export function applyCameraFromState(
  threeCamera: PerspectiveCamera,
  payload: ScenePreviewPayload,
  viewportAspect?: number,
  figureBounds?: FigureBounds | null,
) {
  const { camera: cam, shot } = payload;
  const frame = shot?.frameComposition || DEFAULT_FRAME_COMPOSITION;
  const angle = ANGLE_PRESETS[cam.angle] || ANGLE_PRESETS['eye-level'];
  const framing = FIELD_SIZE_FRAMING[cam.fieldSize] || FIELD_SIZE_FRAMING.ms;
  const placement = getPlacementOffset(frame);

  const bounds: FigureBounds = figureBounds ?? {
    min: { x: -0.3, y: -0.7, z: -0.2 },
    max: { x: 0.3, y: 1.1, z: 0.2 },
    height: 1.8,
    center: { x: 0, y: 0.2, z: 0 },
  };

  let fov = focalLengthToVerticalFov(cam.focalLength || 50);
  fov *= LENS_FOV_SCALE[cam.lensType] || 1;
  fov = Math.min(Math.max(fov, 20), 85);

  const headroom = HEADROOM_OFFSET[frame.headroom] || 0;
  const spanM = bounds.height * framing.spanRatio * (1 + Math.max(headroom, 0) * 0.5);
  const distance = distanceForFraming(spanM, framing.fill, fov);

  const subjectX = bounds.center.x + placement.x;
  const subjectZ = bounds.center.z + placement.z;

  let camX = subjectX + placement.x * 0.08;
  let camY = aimY(bounds, angle.camAim, headroom * 0.5);
  let camZ = subjectZ + distance;
  let lookX = subjectX;
  let lookZ = subjectZ;
  let lookY = aimY(bounds, angle.targetAim, headroom);

  if (cam.coverage === 'ots') {
    camX = subjectX - 0.45;
    camZ = subjectZ + distance * 0.92;
    lookX = subjectX + 0.35;
    lookY = aimY(bounds, 0.76);
  } else if (cam.coverage === 'pov') {
    camY = aimY(bounds, 0.88);
    camZ = subjectZ + 0.2;
    lookX = subjectX;
    lookY = aimY(bounds, 0.86);
    lookZ = subjectZ + distance;
  }

  const pitchRad = (angle.pitch || 0) * (Math.PI / 180);
  camY += Math.sin(pitchRad) * distance * 0.05;
  lookY += Math.sin(pitchRad) * bounds.height * 0.08;

  threeCamera.fov = fov;
  threeCamera.position.set(camX, camY, camZ);
  threeCamera.lookAt(lookX, lookY, lookZ);

  if (cam.angle === 'dutch' && angle.roll) {
    threeCamera.rotation.z = angle.roll * (Math.PI / 180);
  } else {
    threeCamera.rotation.z = 0;
  }

  const aspect = viewportAspect ?? parseAspect(payload.project?.aspectRatio || '16:9');
  threeCamera.aspect = aspect;
  threeCamera.updateProjectionMatrix();

  return {
    target: { x: lookX, y: lookY, z: lookZ },
    distance,
    fov,
    bounds,
    spanM,
  };
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