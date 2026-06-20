'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { BackdropTransformWidget } from '@/components/studio/BackdropTransformWidget';
import { UI_SECTIONS } from '@/lib/constants/ui-sections';
import {
  computeBackdropDrawRect,
  getBackdropFraming,
  isPointInBackdropImage,
  loadImageElement,
} from '@/lib/studio/backdrop-framing';
import type { AspectRatio, Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

const WIDGET_FRAME_WIDTH = 128;
const RING_PAD = 22;

interface FrameBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

function resolveFrameElement(frameRef: RefObject<HTMLElement | null>): HTMLElement | null {
  return frameRef.current ?? document.getElementById(UI_SECTIONS.studioPreviewFrame.id);
}

function measureFrameOnStage(
  stage: HTMLElement | null,
  frame: HTMLElement,
): FrameBox {
  const frameRect = frame.getBoundingClientRect();
  const stageRect = stage?.getBoundingClientRect();
  if (!stageRect) {
    return { left: 0, top: 0, width: frameRect.width, height: frameRect.height };
  }
  return {
    left: frameRect.left - stageRect.left,
    top: frameRect.top - stageRect.top,
    width: frameRect.width,
    height: frameRect.height,
  };
}

function widgetSize(aspectRatio: AspectRatio): { width: number; height: number } {
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w && h ? w / h : 16 / 9;
  const frameH = WIDGET_FRAME_WIDTH / ratio;
  return { width: WIDGET_FRAME_WIDTH + RING_PAD * 2, height: frameH + RING_PAD * 2 };
}

interface BackdropFramingControlsStageProps {
  stageRef: RefObject<HTMLElement | null>;
  frameRef: RefObject<HTMLElement | null>;
  imageUrl: string;
  shot: Shot;
  aspectRatio: AspectRatio;
}

export function BackdropFramingControlsStage({
  stageRef,
  frameRef,
  imageUrl,
  shot,
  aspectRatio,
}: BackdropFramingControlsStageProps) {
  const backdropSelected = useStudioStore((s) => s.backdropSelected);
  const setBackdropSelected = useStudioStore((s) => s.setBackdropSelected);
  const [frameBox, setFrameBox] = useState<FrameBox | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const framing = getBackdropFraming(shot, aspectRatio);
  const framingRef = useRef(framing);
  framingRef.current = framing;

  const updateFrameBox = useCallback(() => {
    const frame = resolveFrameElement(frameRef);
    if (!frame) return;
    const next = measureFrameOnStage(stageRef.current, frame);
    if (next.width <= 0 || next.height <= 0) return;
    setFrameBox(next);
  }, [stageRef, frameRef]);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;

    const setup = () => {
      if (cancelled) return;
      updateFrameBox();

      const observeTargets = new Set<HTMLElement>();
      const frame = resolveFrameElement(frameRef);
      if (frame) observeTargets.add(frame);
      if (stageRef.current) observeTargets.add(stageRef.current);

      if (observeTargets.size === 0) {
        raf = requestAnimationFrame(setup);
        return;
      }

      observer?.disconnect();
      observer = new ResizeObserver(updateFrameBox);
      for (const target of observeTargets) observer.observe(target);
      window.addEventListener('resize', updateFrameBox);
    };

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', updateFrameBox);
    };
  }, [stageRef, frameRef, updateFrameBox]);

  useEffect(() => {
    let cancelled = false;
    loadImageElement(imageUrl)
      .then((img) => {
        if (cancelled) return;
        setImageSize({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      })
      .catch(() => {
        if (!cancelled) setImageSize(null);
      });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !frameBox || !imageSize || framing.locked) return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (
        target.closest('.backdrop-transform-widget') ||
        target.closest('.backdrop-framing-hit-target')
      ) {
        return;
      }

      const frame = resolveFrameElement(frameRef);
      if (!frame) return;

      const frameRect = frame.getBoundingClientRect();
      const localX = event.clientX - frameRect.left;
      const localY = event.clientY - frameRect.top;
      const current = framingRef.current;

      if (
        !isPointInBackdropImage(
          current,
          imageSize.width,
          imageSize.height,
          frameBox.width,
          frameBox.height,
          localX,
          localY,
        )
      ) {
        setBackdropSelected(false);
      }
    };

    stage.addEventListener('pointerdown', onPointerDown);
    return () => stage.removeEventListener('pointerdown', onPointerDown);
  }, [stageRef, frameRef, frameBox, imageSize, framing.locked, setBackdropSelected]);

  if (!frameBox || !imageSize || framing.locked) return null;

  const rect = computeBackdropDrawRect(
    framing,
    imageSize.width,
    imageSize.height,
    frameBox.width,
    frameBox.height,
  );
  const boxTransform = [
    framing.perspective > 0 ? `perspective(${framing.perspective}px)` : null,
    `rotate(${framing.rotation}deg)`,
    `skew(${framing.skewX}deg, ${framing.skewY}deg)`,
  ]
    .filter(Boolean)
    .join(' ');

  const { width: widgetW, height: widgetH } = widgetSize(aspectRatio);
  const widgetLeft = rect.x + rect.width / 2 - widgetW / 2;
  const widgetTop = rect.y + rect.height / 2 - widgetH / 2;

  const handleHitTargetDown = (event: React.PointerEvent) => {
    event.stopPropagation();
    setBackdropSelected(true);
  };

  return (
    <div
      className="backdrop-framing-controls-stage"
      style={{
        left: frameBox.left,
        top: frameBox.top,
        width: frameBox.width,
        height: frameBox.height,
      }}
    >
      <div
        className="backdrop-framing-hit-target"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          transform: boxTransform || undefined,
          transformOrigin: 'center center',
        }}
        onPointerDown={handleHitTargetDown}
      />

      {backdropSelected ? (
        <>
          <div
            className="backdrop-framing-bounds-outline"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              transform: boxTransform || undefined,
              transformOrigin: 'center center',
            }}
          />
          <BackdropTransformWidget
            shot={shot}
            aspectRatio={aspectRatio}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            frameWidth={frameBox.width}
            frameHeight={frameBox.height}
            left={widgetLeft}
            top={widgetTop}
          />
        </>
      ) : null}
    </div>
  );
}