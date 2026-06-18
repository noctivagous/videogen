export const FIELD_SIZE_PROMPTS: Record<string, string> = {
  ecu: 'extreme close-up',
  cu: 'close-up',
  mcu: 'medium close-up',
  'close-shot': 'close shot',
  ms: 'medium shot',
  fs: 'full shot',
  ls: 'long shot',
  els: 'extreme long shot',
  vls: 'very long shot',
  ws: 'wide shot',
  mws: 'medium wide shot',
  bcu: 'big close-up',
  xls: 'extreme long shot',
  cowboy: 'cowboy shot',
  ch: 'choker shot',
  gv: 'general view',
};

export const SUBJECT_COUNT_PROMPTS: Record<string, string> = {
  '1s': 'single subject',
  '2s': 'two-shot',
  '3s': 'three-shot',
  group: 'group shot',
  crowd: 'crowd shot',
};

export const MOVEMENT_PROMPTS: Record<string, string> = {
  static: 'locked-off static camera',
  'pan-left': 'slow pan left',
  'pan-right': 'slow pan right',
  'tilt-up': 'tilt up',
  'tilt-down': 'tilt down',
  'dolly-in': 'dolly in',
  'dolly-out': 'dolly out',
  'truck-left': 'truck left',
  'truck-right': 'truck right',
  orbit: 'orbiting camera move',
  handheld: 'handheld camera',
  drone: 'aerial drone move',
};