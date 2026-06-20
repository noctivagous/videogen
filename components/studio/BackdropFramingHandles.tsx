'use client';

import { useEffect, useRef } from 'react';
import { bindBackdropFramingHandles } from '@/lib/studio/backdrop-framing-handles';
import {
  computeBackdropHandleBox,
  getBackdropFraming,
} from '@/lib/studio/backdrop-framing';
import type { AspectRatio, Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface BackdropFramingHandlesProps {
  shot: Shot;
  aspectRatio: AspectRatio;
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
}

function Handle({
  kind,
  style,
  className = '',
}: {
  kind: string;
  style: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      data-backdrop-handle={kind}
      className={`backdrop-framing-handle backdrop-framing-handle--${kind} ${className}`}
      style={style}
    />
  );
}

export function BackdropFramingHandles({
  shot,
  aspectRatio,
  imageWidth,
  imageHeight,
  frameWidth,
  frameHeight,
}: BackdropFramingHandlesProps) {
  const setBackdropFraming = useStudioStore((s) => s.setBackdropFraming);
  const setBackdropSelected = useStudioStore((s) => s.setBackdropSelected);
  const layerRef = useRef<HTMLDivElement>(null);
  const framing = getBackdropFraming(shot, aspectRatio);
  const framingRef = useRef(framing);
  framingRef.current = framing;

  useEffect(() => {
    const element = layerRef.current;
    if (!element || framing.locked) return;

    return bindBackdropFramingHandles({
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

  if (framing.locked) return null;

  const rect = computeBackdropHandleBox(framing, imageWidth, imageHeight, frameWidth, frameHeight);
  const boxTransform = [
    framing.perspective > 0 ? `perspective(${framing.perspective}px)` : null,
    `rotate(${framing.rotation}deg)`,
    `skew(${framing.skewX}deg, ${framing.skewY}deg)`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={layerRef} className="backdrop-framing-handles absolute inset-0 z-[12]">
      <div
        className="backdrop-framing-box"
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          transform: boxTransform || undefined,
          transformOrigin: 'center center',
        }}
      >
        <Handle kind="move" style={{ inset: 0 }} className="backdrop-framing-handle--move" />
        <Handle kind="corner-tl" style={{ left: 8, top: 8 }} />
        <Handle kind="corner-tr" style={{ right: 8, top: 8 }} />
        <Handle kind="corner-bl" style={{ left: 8, bottom: 8 }} />
        <Handle kind="corner-br" style={{ right: 8, bottom: 8 }} />
        <Handle kind="rotate" style={{ left: '50%', top: 10, transform: 'translateX(-50%)' }} />
        <Handle kind="skew-x" style={{ left: '50%', bottom: 10, transform: 'translateX(-50%)' }} />
        <Handle kind="skew-y" style={{ right: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <Handle kind="perspective" style={{ left: 10, top: '50%', transform: 'translateY(-50%)' }} />
      </div>
    </div>
  );
}