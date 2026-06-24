'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  framingToLayerStyle,
  getBackdropFraming,
  getBackdropPreviewUrl,
  loadImageElement,
} from '@/lib/studio/backdrop-framing';
import type { AspectRatio, BackdropFraming, Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface FrameBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

type BackdropFramingPart = 'dimmed' | 'bright' | 'crop';

interface BackdropFramingLayerProps {
  stageRef: RefObject<HTMLElement | null>;
  frameRef: RefObject<HTMLElement | null>;
  imageUrl: string;
  shot: Shot;
  aspectRatio: AspectRatio;
  part: BackdropFramingPart;
  /** Stage-relative for dimmed overflow; frame-relative for bright/crop. */
  positionMode: 'stage' | 'frame';
}

function resolveFrameElement(frameRef: RefObject<HTMLElement | null>): HTMLElement | null {
  return frameRef.current ?? document.getElementById(UI_SECTIONS.studioPreviewFrame.id);
}

function measureFrameBox(
  stage: HTMLElement | null,
  frame: HTMLElement,
  positionMode: 'stage' | 'frame',
): FrameBox {
  const frameRect = frame.getBoundingClientRect();
  if (positionMode === 'frame') {
    return {
      left: 0,
      top: 0,
      width: frameRect.width,
      height: frameRect.height,
    };
  }
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

function measureLayerBox(layer: HTMLElement): FrameBox {
  const rect = layer.getBoundingClientRect();
  return {
    left: 0,
    top: 0,
    width: rect.width,
    height: rect.height,
  };
}

function BackdropFramingImage({
  imageUrl,
  framing,
  imageWidth,
  imageHeight,
  frameBox,
  variant,
}: {
  imageUrl: string;
  framing: BackdropFraming;
  imageWidth: number;
  imageHeight: number;
  frameBox: FrameBox;
  variant: 'dimmed' | 'bright';
}) {
  const style = framingToLayerStyle(
    framing,
    imageWidth,
    imageHeight,
    frameBox.width,
    frameBox.height,
  );

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={imageUrl}
      alt=""
      aria-hidden
      className={`backdrop-framing-image backdrop-framing-image--${variant}`}
      style={style}
      draggable={false}
    />
  );
}

export function BackdropFramingLayer({
  stageRef,
  frameRef,
  imageUrl,
  shot,
  aspectRatio,
  part,
  positionMode,
}: BackdropFramingLayerProps) {
  const framing = getBackdropFraming(shot, aspectRatio);
  const layerRef = useRef<HTMLDivElement>(null);
  const [frameBox, setFrameBox] = useState<FrameBox | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const updateFrameBox = useCallback(() => {
    if (positionMode === 'frame') {
      const layer = layerRef.current;
      if (!layer) return;
      const next = measureLayerBox(layer);
      if (next.width <= 0 || next.height <= 0) return;
      setFrameBox(next);
      return;
    }

    const frame = resolveFrameElement(frameRef);
    if (!frame) return;
    const next = measureFrameBox(stageRef.current, frame, positionMode);
    if (next.width <= 0 || next.height <= 0) return;
    setFrameBox(next);
  }, [stageRef, frameRef, positionMode]);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;

    const setup = () => {
      if (cancelled) return;
      updateFrameBox();

      const observeTargets = new Set<HTMLElement>();
      if (positionMode === 'frame') {
        const layer = layerRef.current;
        if (layer) observeTargets.add(layer);
      } else {
        const frame = resolveFrameElement(frameRef);
        if (frame) observeTargets.add(frame);
        if (stageRef.current) observeTargets.add(stageRef.current);
      }

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
  }, [stageRef, frameRef, positionMode, updateFrameBox]);

  useEffect(() => {
    let cancelled = false;
    const url = part === 'crop' ? getBackdropPreviewUrl(shot, aspectRatio, shot.lighting) : imageUrl;
    if (!url) return;
    loadImageElement(url)
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
  }, [imageUrl, part, shot, aspectRatio]);

  const slotStyle =
    positionMode === 'frame'
      ? { inset: 0, width: '100%', height: '100%' }
      : frameBox
        ? {
            left: frameBox.left,
            top: frameBox.top,
            width: frameBox.width,
            height: frameBox.height,
          }
        : { visibility: 'hidden' as const, inset: 0, width: 0, height: 0 };

  if (part === 'crop') {
    const cropUrl = getBackdropPreviewUrl(shot, aspectRatio, shot.lighting);
    return (
      <div
        ref={layerRef}
        className="backdrop-framing-layer backdrop-framing-layer--crop"
        style={slotStyle}
        {...uiSectionProps(UI_SECTIONS.studioPreviewBackdropFraming)}
      >
        {cropUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={cropUrl}
            alt=""
            aria-hidden
            className="backdrop-framing-crop-image absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : null}
      </div>
    );
  }

  const variant = part === 'dimmed' ? 'dimmed' : 'bright';

  return (
    <div
      ref={layerRef}
      className={`backdrop-framing-layer backdrop-framing-layer--${variant}`}
      style={slotStyle}
      {...(part === 'dimmed' ? uiSectionProps(UI_SECTIONS.studioPreviewBackdropFraming) : {})}
    >
      {frameBox && imageSize ? (
        <BackdropFramingImage
          imageUrl={imageUrl}
          framing={framing}
          imageWidth={imageSize.width}
          imageHeight={imageSize.height}
          frameBox={frameBox}
          variant={variant}
        />
      ) : null}
    </div>
  );
}

interface BackdropFramingEditStackProps {
  frameRef: RefObject<HTMLElement | null>;
  imageUrl: string;
  shot: Shot;
  aspectRatio: AspectRatio;
}

export function BackdropFramingEditStack({
  frameRef,
  imageUrl,
  shot,
  aspectRatio,
}: BackdropFramingEditStackProps) {
  const backdropSelected = useStudioStore((s) => s.backdropSelected);
  const framing = getBackdropFraming(shot, aspectRatio);
  const layerRef = useRef<HTMLDivElement>(null);
  const [frameBox, setFrameBox] = useState<FrameBox | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const updateFrameBox = useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const next = measureLayerBox(layer);
    if (next.width <= 0 || next.height <= 0) return;
    setFrameBox(next);
  }, []);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;

    const setup = () => {
      if (cancelled) return;
      updateFrameBox();
      const layer = layerRef.current;
      if (!layer) {
        raf = requestAnimationFrame(setup);
        return;
      }
      observer?.disconnect();
      observer = new ResizeObserver(updateFrameBox);
      observer.observe(layer);
      const frame = resolveFrameElement(frameRef);
      if (frame) observer.observe(frame);
      window.addEventListener('resize', updateFrameBox);
    };

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', updateFrameBox);
    };
  }, [frameRef, updateFrameBox]);

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

  return (
    <div ref={layerRef} className="backdrop-framing-edit-stack absolute inset-0 z-[1] pointer-events-none">
      <div
        className={`backdrop-framing-layer backdrop-framing-layer--bright ${backdropSelected ? 'backdrop-framing-layer--selected' : ''}`}
        style={{ inset: 0, width: '100%', height: '100%' }}
      >
        {frameBox && imageSize ? (
          <BackdropFramingImage
            imageUrl={imageUrl}
            framing={framing}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            frameBox={frameBox}
            variant="bright"
          />
        ) : null}
      </div>
    </div>
  );
}