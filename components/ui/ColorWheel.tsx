'use client';

import { useCallback, useMemo, useRef } from 'react';
import { normalizeHue } from '@/lib/constants/color-palette';

export interface ColorWheelProps {
  hue: number;
  saturation: number;
  brightness: number;
  accentHues?: number[];
  selectedAccentHue?: number | null;
  onChange: (hue: number) => void;
  onAccentSelect?: (hue: number) => void;
  size?: number;
  className?: string;
}

function hueFromPointer(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  return normalizeHue(angle + 90);
}

function thumbPosition(hue: number, ringSize: number, thumbRadius: number) {
  const rad = ((hue - 90) * Math.PI) / 180;
  return {
    x: ringSize / 2 + Math.cos(rad) * thumbRadius,
    y: ringSize / 2 + Math.sin(rad) * thumbRadius,
  };
}

function innerGradient(
  dominantHue: number,
  accentHues: number[],
  saturation: number,
  brightness: number,
): string {
  const hues = [normalizeHue(dominantHue), ...accentHues.map(normalizeHue)];

  if (hues.length === 1) {
    const litLow = Math.max(12, brightness - 18);
    const litHigh = Math.min(88, brightness + 18);
    return `linear-gradient(145deg, hsl(${hues[0]}, ${saturation}%, ${litLow}%), hsl(${hues[0]}, ${saturation}%, ${litHigh}%))`;
  }

  const segment = 360 / hues.length;
  const stops = hues
    .map((h, i) => {
      const color = `hsl(${h}, ${saturation}%, ${brightness}%)`;
      const start = i * segment;
      const end = (i + 1) * segment;
      return `${color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return `conic-gradient(from -90deg, ${stops})`;
}

export function ColorWheel({
  hue,
  saturation,
  brightness,
  accentHues = [],
  selectedAccentHue = null,
  onChange,
  onAccentSelect,
  size = 140,
  className = '',
}: ColorWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);

  const normalizedAccents = useMemo(
    () => accentHues.map(normalizeHue).filter((accent) => accent !== normalizeHue(hue)),
    [accentHues, hue],
  );

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = wheelRef.current;
      if (!el) return;
      onChange(hueFromPointer(clientX, clientY, el.getBoundingClientRect()));
    },
    [onChange],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromEvent(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateFromEvent(e.clientX, e.clientY);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(normalizeHue(hue - 5));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(normalizeHue(hue + 5));
    }
  };

  const ringSize = size;
  const thumbRadius = ringSize / 2 - 10;
  const dominant = thumbPosition(hue, ringSize, thumbRadius);

  return (
    <div
      ref={wheelRef}
      className={`color-wheel relative shrink-0 rounded-full cursor-pointer select-none touch-none ${className}`.trim()}
      style={{ width: ringSize, height: ringSize }}
      role="slider"
      aria-label="Dominant hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onKeyDown={onKeyDown}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          mask: 'radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 17px))',
          WebkitMask:
            'radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 17px))',
        }}
      />

      <div
        className="absolute rounded-full border border-surface-600 overflow-hidden pointer-events-none"
        style={{
          inset: 22,
          background: innerGradient(hue, normalizedAccents, saturation, brightness),
        }}
      />

      {normalizedAccents.map((accentHue) => {
        const { x, y } = thumbPosition(accentHue, ringSize, thumbRadius);
        const isSelected = selectedAccentHue === accentHue;
        return (
          <button
            key={accentHue}
            type="button"
            className={`absolute rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${
              isSelected
                ? 'w-3.5 h-3.5 border-brand-400 ring-2 ring-brand-500/50'
                : 'w-3 h-3 border-white/80'
            }`}
            style={{
              left: x - (isSelected ? 7 : 6),
              top: y - (isSelected ? 7 : 6),
              background: `hsl(${accentHue}, 100%, 50%)`,
            }}
            aria-label={`Accent hue ${Math.round(accentHue)} degrees`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAccentSelect?.(accentHue);
            }}
          />
        );
      })}

      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none z-10"
        style={{
          left: dominant.x - 8,
          top: dominant.y - 8,
          background: `hsl(${hue}, 100%, 50%)`,
        }}
      />
    </div>
  );
}