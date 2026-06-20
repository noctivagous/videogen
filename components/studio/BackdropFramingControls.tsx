'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { BackdropTransformWidget } from '@/components/studio/BackdropTransformWidget';
import {
  BACKDROP_WIDGET_CURSORS,
  BACKDROP_WIDGET_DRAGGING_CLASS,
} from '@/lib/studio/backdrop-transform-cursors';
import { bindBackdropFramingPointer } from '@/lib/studio/backdrop-framing-pointer';
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

function measureLayerBox(layer: HTMLElement): FrameBox {
  const rect = layer.getBoundingClientRect();
  return { left: 0, top: 0, width: rect.width, height: rect.height };
}

function widgetSize(aspectRatio: AspectRatio): { width: number; height: number } {
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w && h ? w / h : 16 / 9;
  const frameH = WIDGET_FRAME_WIDTH / ratio;
  return { width: WIDGET_FRAME_WIDTH + RING_PAD * 2, height: frameH + RING_PAD * 2 };
}

function overflowClipPath(frameBox: FrameBox): string {
  const fl = frameBox.left;
  const ft = frameBox.top;
  const fr = fl + frameBox.width;
  const fb = ft + frameBox.height;
  return `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${fl}px ${ft}px, ${fr}px ${ft}px, ${fr}px ${fb}px, ${fl}px ${fb}px, ${fl}px ${ft}px)`;
}

interface BackdropFramingControlsProps {
  stageRef: RefObject<HTMLElement | null>;
  frameRef: RefObject<HTMLElement | null>;
  imageUrl: string;
  shot: Shot;
  aspectRatio: AspectRatio;
}

function useBackdropFramingControls({
  stageRef,
  frameRef,
  imageUrl,
  shot,
  aspectRatio,
  frameBox,
}: BackdropFramingControlsProps & { frameBox: FrameBox | null }) {
  const backdropSelected = useStudioStore((s) => s.backdropSelected);
  const setBackdropSelected = useStudioStore((s) => s.setBackdropSelected);
  const setBackdropFraming = useStudioStore((s) => s.setBackdropFraming);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const framing = getBackdropFraming(shot, aspectRatio);
  const framingRef = useRef(framing);
  framingRef.current = framing;
  const frameBoxRef = useRef(frameBox);
  frameBoxRef.current = frameBox;
  const imageSizeRef = useRef(imageSize);
  imageSizeRef.current = imageSize;

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
    const onPointerDownCapture = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const fb = frameBoxRef.current;
      const is = imageSizeRef.current;
      if (!fb || !is || framingRef.current.locked) return;

      const target = event.target as HTMLElement;
      if (
        target.closest('.backdrop-transform-widget') ||
        target.closest('.backdrop-framing-hit-target') ||
        target.closest('.backdrop-framing-pan-layer')
      ) {
        return;
      }

      const frame = resolveFrameElement(frameRef);
      if (!frame) return;

      const frameRect = frame.getBoundingClientRect();
      const localX = event.clientX - frameRect.left;
      const localY = event.clientY - frameRect.top;

      if (
        !isPointInBackdropImage(
          framingRef.current,
          is.width,
          is.height,
          fb.width,
          fb.height,
          localX,
          localY,
        )
      ) {
        setBackdropSelected(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => window.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [frameRef, setBackdropSelected]);

  const bindPanLayer = useCallback(
    (element: HTMLElement | null) => {
      if (!element || !frameBox || !imageSize || framing.locked) return;

      return bindBackdropFramingPointer({
        element,
        getFraming: () => framingRef.current,
        imageWidth: imageSize.width,
        imageHeight: imageSize.height,
        frameWidth: frameBox.width,
        frameHeight: frameBox.height,
        onFramingChange: (patch) => setBackdropFraming(patch),
        onDragStart: () => {
          setBackdropSelected(true);
          document.body.classList.add(BACKDROP_WIDGET_DRAGGING_CLASS);
          document.body.style.setProperty(
            '--backdrop-active-cursor',
            BACKDROP_WIDGET_CURSORS['pan-active'],
          );
        },
        onDragEnd: () => {
          document.body.classList.remove(BACKDROP_WIDGET_DRAGGING_CLASS);
          document.body.style.removeProperty('--backdrop-active-cursor');
        },
      });
    },
    [frameBox, imageSize, framing.locked, setBackdropFraming, setBackdropSelected],
  );

  if (!frameBox || !imageSize || framing.locked) {
    return null;
  }

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

  const imageLayerStyle = {
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    transform: boxTransform || undefined,
    transformOrigin: 'center center' as const,
  };

  const { width: widgetW, height: widgetH } = widgetSize(aspectRatio);

  return {
    backdropSelected,
    setBackdropSelected,
    framing,
    imageSize,
    frameBox,
    imageLayerStyle,
    widgetLeft: rect.x + rect.width / 2 - widgetW / 2,
    widgetTop: rect.y + rect.height / 2 - widgetH / 2,
    bindPanLayer,
    shot,
    aspectRatio,
  };
}

/** Inside #studio-preview-frame — below composition chrome (z-8 pan), widget at z-50. */
export function BackdropFramingControlsInFrame(props: BackdropFramingControlsProps) {
  const panLayerRef = useRef<HTMLDivElement>(null);
  const [measuredFrameBox, setMeasuredFrameBox] = useState<FrameBox | null>(null);

  const updateFrameBox = useCallback(() => {
    const frame = resolveFrameElement(props.frameRef);
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setMeasuredFrameBox({ left: 0, top: 0, width: rect.width, height: rect.height });
  }, [props.frameRef]);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;

    const setup = () => {
      if (cancelled) return;
      updateFrameBox();
      const frame = resolveFrameElement(props.frameRef);
      if (!frame) {
        raf = requestAnimationFrame(setup);
        return;
      }
      observer?.disconnect();
      observer = new ResizeObserver(updateFrameBox);
      observer.observe(frame);
      window.addEventListener('resize', updateFrameBox);
    };

    setup();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', updateFrameBox);
    };
  }, [props.frameRef, updateFrameBox]);

  const state = useBackdropFramingControls({ ...props, frameBox: measuredFrameBox });
  const bindPanLayer = state?.bindPanLayer;

  useEffect(() => {
    if (!bindPanLayer) return;
    return bindPanLayer(panLayerRef.current);
  }, [bindPanLayer]);

  if (!state) return null;

  const {
    backdropSelected,
    imageLayerStyle,
    widgetLeft,
    widgetTop,
    shot,
    aspectRatio,
    imageSize,
    frameBox: controlFrameBox,
  } = state;

  return (
    <>
      <div className="backdrop-framing-controls-in-frame absolute inset-0 pointer-events-none">
        <div
          ref={panLayerRef}
          className="backdrop-framing-pan-layer backdrop-framing-pan-layer--in-frame"
          style={{
            ...imageLayerStyle,
            cursor: BACKDROP_WIDGET_CURSORS.pan,
          }}
        />
        {backdropSelected && (
          <div className="backdrop-framing-bounds-outline" style={imageLayerStyle} />
        )}
      </div>
      {backdropSelected && (
        <div className="backdrop-framing-widget-layer absolute inset-0 pointer-events-none">
          <BackdropTransformWidget
            shot={shot}
            aspectRatio={aspectRatio}
            imageWidth={imageSize.width}
            imageHeight={imageSize.height}
            frameWidth={controlFrameBox.width}
            frameHeight={controlFrameBox.height}
            left={widgetLeft}
            top={widgetTop}
          />
        </div>
      )}
    </>
  );
}

/** On preview stage — pan/select only in dimmed overflow outside the frame (z-5, below frame UI). */
export function BackdropFramingControlsOverflow(props: BackdropFramingControlsProps) {
  const panLayerRef = useRef<HTMLDivElement>(null);
  const [stageFrameBox, setStageFrameBox] = useState<FrameBox | null>(null);

  const updateStageFrameBox = useCallback(() => {
    const frame = resolveFrameElement(props.frameRef);
    if (!frame) return;
    const next = measureFrameOnStage(props.stageRef.current, frame);
    if (next.width <= 0 || next.height <= 0) return;
    setStageFrameBox(next);
  }, [props.stageRef, props.frameRef]);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    let observer: ResizeObserver | null = null;

    const setup = () => {
      if (cancelled) return;
      updateStageFrameBox();
      const frame = resolveFrameElement(props.frameRef);
      if (!frame && !props.stageRef.current) {
        raf = requestAnimationFrame(setup);
        return;
      }
      observer?.disconnect();
      observer = new ResizeObserver(updateStageFrameBox);
      if (frame) observer.observe(frame);
      if (props.stageRef.current) observer.observe(props.stageRef.current);
      window.addEventListener('resize', updateStageFrameBox);
    };

    setup();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', updateStageFrameBox);
    };
  }, [props.stageRef, props.frameRef, updateStageFrameBox]);

  const frameBox = stageFrameBox
    ? { left: 0, top: 0, width: stageFrameBox.width, height: stageFrameBox.height }
    : null;

  const state = useBackdropFramingControls({ ...props, frameBox });
  const bindPanLayer = state?.bindPanLayer;

  useEffect(() => {
    if (!bindPanLayer) return;
    return bindPanLayer(panLayerRef.current);
  }, [bindPanLayer]);

  if (!state || !stageFrameBox) return null;

  const { imageLayerStyle, imageSize, framing } = state;

  const rect = computeBackdropDrawRect(
    framing,
    imageSize.width,
    imageSize.height,
    stageFrameBox.width,
    stageFrameBox.height,
  );

  const overflowLayerStyle = {
    position: 'absolute' as const,
    left: stageFrameBox.left + rect.x,
    top: stageFrameBox.top + rect.y,
    width: rect.width,
    height: rect.height,
    transform: imageLayerStyle.transform,
    transformOrigin: imageLayerStyle.transformOrigin,
    clipPath: overflowClipPath(stageFrameBox),
    WebkitClipPath: overflowClipPath(stageFrameBox),
  };

  return (
    <div className="backdrop-framing-controls-overflow absolute inset-0 pointer-events-none">
      <div
        ref={panLayerRef}
        className="backdrop-framing-pan-layer backdrop-framing-pan-layer--overflow"
        style={{
          ...overflowLayerStyle,
          cursor: BACKDROP_WIDGET_CURSORS.pan,
        }}
      />
    </div>
  );
}