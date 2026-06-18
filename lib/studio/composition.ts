import {
  CAMERA_COVERAGE_LABELS,
  CAMERA_FIELD_SIZE_SHORT,
  CAMERA_SUBJECT_COUNT_SHORT,
  DEFAULT_FRAME_COMPOSITION,
  FRAME_GUIDE_LABELS,
  HEADROOM_FIELD_SIZES,
  PLACEMENT_LABELS,
  PLACEMENT_POSITIONS,
  normalizeCompositionGuide,
  normalizePlacement,
  placementFramingPrompt,
} from '@/lib/constants/camera';
import type {
  CameraSettings,
  CompositionGuide,
  FrameComposition,
  Placement,
  Shot,
} from '@/lib/types/studio';

export function getShotFrameComposition(shot: Shot | undefined): FrameComposition {
  if (!shot) return { ...DEFAULT_FRAME_COMPOSITION };
  if (!shot.frameComposition) {
    shot.frameComposition = { ...DEFAULT_FRAME_COMPOSITION };
  }
  shot.frameComposition.guide = normalizeCompositionGuide(shot.frameComposition.guide);
  shot.frameComposition.placement = normalizePlacement(shot.frameComposition.placement);
  return shot.frameComposition;
}

export function cloneFrameComposition(shot: Shot | undefined): FrameComposition {
  return { ...getShotFrameComposition(shot) };
}

export function getCameraCompositionLabel(
  camera: CameraSettings,
  frame: FrameComposition,
): string {
  const parts = [
    CAMERA_FIELD_SIZE_SHORT[camera.fieldSize] || camera.fieldSize.toUpperCase(),
    CAMERA_SUBJECT_COUNT_SHORT[camera.subjectCount] || camera.subjectCount,
  ];

  if (camera.subjectCount === '1s') {
    parts.push(CAMERA_COVERAGE_LABELS[camera.coverage] || camera.coverage);
  }

  if (frame.guide !== 'none') {
    parts.push(FRAME_GUIDE_LABELS[frame.guide] || frame.guide);
    if (frame.guide !== 'fill-frame' && frame.guide !== 'center') {
      parts.push(PLACEMENT_LABELS[frame.placement] || frame.placement);
    }
  }

  return parts.join(' · ');
}

export function applyFrameCompositionSmartDefaults(
  camera: CameraSettings,
  frame: FrameComposition,
): void {
  if (camera.coverage === 'ots' && frame.guide !== 'fill-frame') {
    frame.placement = 'ix-mid-l';
  } else if (
    (camera.subjectCount === '2s' || camera.subjectCount === '3s') &&
    frame.guide !== 'fill-frame'
  ) {
    frame.placement = 'cell-1-1';
  }

  if (frame.guide === 'center') {
    frame.placement = 'cell-1-1';
  }
}

export function showPlacementGrid(guide: CompositionGuide): boolean {
  return guide === 'grid-3x3';
}

export function showHeadroomControl(fieldSize: string): boolean {
  return HEADROOM_FIELD_SIZES.has(fieldSize as never);
}

export function getCompositionSvgLines(guide: CompositionGuide): string {
  const lines = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%"/>`;

  switch (guide) {
    case 'grid-3x3':
      return [
        lines(33.33, 0, 33.33, 100),
        lines(66.66, 0, 66.66, 100),
        lines(0, 33.33, 100, 33.33),
        lines(0, 66.66, 100, 66.66),
      ].join('');
    case 'center':
      return [lines(50, 0, 50, 100), lines(0, 50, 100, 50)].join('');
    case 'fill-frame':
      return '<rect x="4%" y="4%" width="92%" height="92%" fill="none"/>';
    default:
      return '';
  }
}

export function getPlacementMarkerPosition(placement: Placement): { x: number; y: number } | null {
  return PLACEMENT_POSITIONS[placement] ?? null;
}

export function getFullCameraPrompt(camera: CameraSettings, frame: FrameComposition): string {
  const fieldLabels: Record<string, string> = {
    ecu: 'extreme close-up', cu: 'close-up', mcu: 'medium close-up',
    'close-shot': 'close shot', ms: 'medium shot', fs: 'full shot',
    ls: 'long shot', els: 'extreme long shot', vls: 'very long shot',
    ws: 'wide shot', mws: 'medium wide shot', bcu: 'big close-up',
    xls: 'extreme long shot', cowboy: 'cowboy shot', ch: 'choker shot', gv: 'general view',
  };

  const countLabels: Record<string, string> = {
    '1s': 'one shot', '2s': 'two shot', '3s': 'three shot',
    group: 'group shot', crowd: 'crowd shot',
  };

  const coveragePrompts: Record<string, string> = {
    clean: '',
    'dirty-single': 'dirty single',
    ots: 'over-the-shoulder',
    'one-half': 'one and a half shot',
    pov: 'point of view',
  };

  const parts = [fieldLabels[camera.fieldSize], countLabels[camera.subjectCount]];
  if (camera.subjectCount === '1s') {
    const coverage = coveragePrompts[camera.coverage];
    if (coverage) parts.push(coverage);
  }

  const framePrompt = getFrameCompositionPrompt(camera.fieldSize, frame);
  return [parts.filter(Boolean).join(', '), framePrompt].filter(Boolean).join(', ');
}

function getFrameCompositionPrompt(fieldSize: string, frame: FrameComposition): string {
  if (frame.guide === 'none') return '';

  const parts: string[] = [];

  if (frame.guide === 'grid-3x3') {
    parts.push(placementFramingPrompt(frame.placement));
  } else if (frame.guide === 'center') {
    parts.push('symmetrical centered composition with subject in the exact center of the frame');
  } else if (frame.guide === 'fill-frame') {
    parts.push('subject fills the frame edge to edge');
  }

  if (HEADROOM_FIELD_SIZES.has(fieldSize as never) && frame.headroom !== 'normal') {
    parts.push(`${frame.headroom} headroom above subject`);
  }

  return parts.filter(Boolean).join(', ');
}