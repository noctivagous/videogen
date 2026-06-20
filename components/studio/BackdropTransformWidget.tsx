'use client';

import { useEffect, useMemo, useRef } from 'react';
import { bindBackdropTransformWidget } from '@/lib/studio/backdrop-transform-widget';
import { BACKDROP_WIDGET_CURSORS } from '@/lib/studio/backdrop-transform-cursors';
import { getBackdropFraming } from '@/lib/studio/backdrop-framing';
import type { AspectRatio, Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

const WIDGET_FRAME_WIDTH = 128;
const RING_PAD = 22;

function parseAspectRatio(aspectRatio: AspectRatio): number {
  const [w, h] = aspectRatio.split(':').map(Number);
  return w && h ? w / h : 16 / 9;
}

interface BackdropTransformWidgetProps {
  shot: Shot;
  aspectRatio: AspectRatio;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  left: number;
  top: number;
}

export function BackdropTransformWidget({
  shot,
  aspectRatio,
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
  left,
  top,
}: BackdropTransformWidgetProps) {
  const setBackdropFraming = useStudioStore((s) => s.setBackdropFraming);
  const setBackdropSelected = useStudioStore((s) => s.setBackdropSelected);
  const widgetRef = useRef<HTMLDivElement>(null);
  const framing = getBackdropFraming(shot, aspectRatio);
  const framingRef = useRef(framing);
  framingRef.current = framing;

  const layout = useMemo(() => {
    const ratio = parseAspectRatio(aspectRatio);
    const frameH = WIDGET_FRAME_WIDTH / ratio;
    const svgW = WIDGET_FRAME_WIDTH + RING_PAD * 2;
    const svgH = frameH + RING_PAD * 2;
    const frameX = RING_PAD;
    const frameY = RING_PAD;
    const ringCx = svgW / 2;
    const ringCy = svgH / 2;
    const ringR = Math.max(WIDGET_FRAME_WIDTH, frameH) / 2 + 14;
    return { ratio, frameH, svgW, svgH, frameX, frameY, ringCx, ringCy, ringR };
  }, [aspectRatio]);

  useEffect(() => {
    const element = widgetRef.current;
    if (!element || framing.locked) return;

    return bindBackdropTransformWidget({
      element,
      getFraming: () => framingRef.current,
      imageWidth,
      imageHeight,
      frameWidth,
      frameHeight,
      onFramingChange: (patch) => setBackdropFraming(patch),
      onSelect: () => setBackdropSelected(true),
    });
  }, [
    framing.locked,
    imageWidth,
    imageHeight,
    frameWidth,
    frameHeight,
    setBackdropFraming,
    setBackdropSelected,
  ]);

  const { frameH, svgW, svgH, frameX, frameY, ringCx, ringCy, ringR } = layout;
  const handleR = 5;

  const cursorStyle = {
    '--cursor-rotate': BACKDROP_WIDGET_CURSORS.rotate,
    '--cursor-rotate-active': BACKDROP_WIDGET_CURSORS['rotate-active'],
    '--cursor-pan': BACKDROP_WIDGET_CURSORS.pan,
    '--cursor-pan-active': BACKDROP_WIDGET_CURSORS['pan-active'],
    '--cursor-scale-nwse': BACKDROP_WIDGET_CURSORS['scale-nwse'],
    '--cursor-scale-nesw': BACKDROP_WIDGET_CURSORS['scale-nesw'],
    '--cursor-scale-free': BACKDROP_WIDGET_CURSORS['scale-free'],
    '--cursor-skew-x': BACKDROP_WIDGET_CURSORS['skew-x'],
    '--cursor-skew-y': BACKDROP_WIDGET_CURSORS['skew-y'],
    '--cursor-perspective': BACKDROP_WIDGET_CURSORS.perspective,
    '--cursor-zoom': BACKDROP_WIDGET_CURSORS.zoom,
    left,
    top,
    width: svgW,
    height: svgH,
  } as React.CSSProperties;

  return (
    <div
      ref={widgetRef}
      className="backdrop-transform-widget"
      style={cursorStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <svg
        className="backdrop-transform-widget__svg"
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        aria-label="Backdrop transform controls"
      >
        <circle
          data-backdrop-widget="rotate"
          className="backdrop-transform-widget__rotate-ring"
          cx={ringCx}
          cy={ringCy}
          r={ringR}
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeDasharray="5 6"
          pointerEvents="stroke"
        />
        <rect
          data-backdrop-widget="pan"
          className="backdrop-transform-widget__frame"
          x={frameX}
          y={frameY}
          width={WIDGET_FRAME_WIDTH}
          height={frameH}
          rx={3}
          ry={3}
        />
        <circle
          data-backdrop-widget="scale-tl"
          data-backdrop-scale-cursor="nwse"
          className="backdrop-transform-widget__handle backdrop-transform-widget__handle--scale"
          cx={frameX}
          cy={frameY}
          r={handleR}
        />
        <circle
          data-backdrop-widget="scale-tr"
          data-backdrop-scale-cursor="nesw"
          className="backdrop-transform-widget__handle backdrop-transform-widget__handle--scale"
          cx={frameX + WIDGET_FRAME_WIDTH}
          cy={frameY}
          r={handleR}
        />
        <circle
          data-backdrop-widget="scale-bl"
          data-backdrop-scale-cursor="nesw"
          className="backdrop-transform-widget__handle backdrop-transform-widget__handle--scale"
          cx={frameX}
          cy={frameY + frameH}
          r={handleR}
        />
        <circle
          data-backdrop-widget="scale-br"
          data-backdrop-scale-cursor="nwse"
          className="backdrop-transform-widget__handle backdrop-transform-widget__handle--scale"
          cx={frameX + WIDGET_FRAME_WIDTH}
          cy={frameY + frameH}
          r={handleR}
        />
        <rect
          data-backdrop-widget="skew-x"
          className="backdrop-transform-widget__handle backdrop-transform-widget__handle--skew"
          x={frameX + WIDGET_FRAME_WIDTH / 2 - 10}
          y={frameY + frameH - 3}
          width={20}
          height={6}
          rx={2}
        />
        <rect
          data-backdrop-widget="skew-y"
          className="backdrop-transform-widget__handle backdrop-transform-widget__handle--skew"
          x={frameX + WIDGET_FRAME_WIDTH - 3}
          y={frameY + frameH / 2 - 10}
          width={6}
          height={20}
          rx={2}
        />
        <circle
          data-backdrop-widget="perspective"
          className="backdrop-transform-widget__handle backdrop-transform-widget__handle--perspective"
          cx={frameX - 10}
          cy={frameY + frameH + 10}
          r={4.5}
        />
        <text
          className="backdrop-transform-widget__hint"
          x={ringCx}
          y={svgH - 4}
          textAnchor="middle"
        >
          shift + corner: free scale
        </text>
      </svg>
    </div>
  );
}