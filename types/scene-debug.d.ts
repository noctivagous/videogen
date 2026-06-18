interface SceneDebugInfo {
  camera: { position: number[]; fov: number; aspect: number };
  framing: Record<string, unknown> | null;
  bounds: unknown;
  figures?: unknown[];
  mount: { w: number; h: number };
  mode?: 'vector' | '3d';
}

interface Window {
  __sceneDebug?: SceneDebugInfo;
}