declare module 'mannequin-js/src/mannequin.js' {
  export class Male {
    constructor(height?: number);
    turn: number;
    visible: boolean;
    position: { set: (x: number, y: number, z: number) => void };
    scale: { setScalar: (s: number) => void };
    torso: { bend: number };
    head: { nod: number };
    l_arm: { raise: number };
    r_arm: { raise: number; show: () => void };
    l_elbow: { bend: number };
    r_elbow: { bend: number };
    l_leg: { raise: number; show: () => void; hide: () => void };
    r_leg: { raise: number; show: () => void; hide: () => void };
    recolor: (...colors: string[]) => void;
    stepOnGround: () => void;
  }

  export class Child extends Male {}

  export function createStage(animationLoop?: (time: number) => void): void;
  export function getStage(): {
    controls?: { enabled: boolean };
    animationLoop?: (time: number) => void;
    ground?: unknown;
  };
}

declare module 'mannequin-js/src/scene.js' {
  import type { Clock, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

  export const renderer: WebGLRenderer;
  export const scene: Scene;
  export const camera: PerspectiveCamera;
  export const light: DirectionalLight;
  export const clock: Clock;
  export function createStage(animationLoop?: (time: number) => void): void;
  export function getStage(): unknown;
}