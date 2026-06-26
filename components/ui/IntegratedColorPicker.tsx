'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { RangeSlider } from '@/components/ui/RangeSlider';
import {
  findClosestHarmonyVariation,
  harmonyVariationHues,
  harmonyVariationSwatchColors,
  HARMONY_VARIATION_CATEGORY_LABELS,
  HARMONY_VARIATIONS,
  hueToColorName,
  normalizeHue,
  type HarmonyVariation,
  type HarmonyVariationCategory,
} from '@/lib/constants/color-palette';

const VARIATION_CATEGORIES: HarmonyVariationCategory[] = ['tint', 'tone', 'shade'];

const DISC_SIZE = 240;
const BRIGHTNESS_MIN = 0;
const BRIGHTNESS_MAX = 92;
const SLIDER_WIDTH = 28;
const DEFAULT_HUE_STEPS = 20;
const RADIAL_BRIGHTNESS_STEPS = 10;

const HUE_CONIC =
  'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';

const WHEEL_RESOLUTION_MIN = 5;
const WHEEL_RESOLUTION_MAX = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolutionForHueSteps(steps: number): number {
  const clamped = clamp(steps, 3, 72);
  const t = (clamped - 3) / 69;
  return Math.round(WHEEL_RESOLUTION_MIN + t * (WHEEL_RESOLUTION_MAX - WHEEL_RESOLUTION_MIN - 1));
}

const DEFAULT_WHEEL_RESOLUTION = resolutionForHueSteps(DEFAULT_HUE_STEPS);

/** Below 100% the wheel uses discrete hue steps; at 100% it stays smooth. */
function hueStepCount(resolution: number): number | null {
  if (resolution >= WHEEL_RESOLUTION_MAX) return null;
  const t = (resolution - WHEEL_RESOLUTION_MIN) / (WHEEL_RESOLUTION_MAX - WHEEL_RESOLUTION_MIN - 1);
  return Math.max(3, Math.round(3 + t * 69));
}

function quantizeHueToWheelResolution(hue: number, resolution: number): number {
  if (resolution >= WHEEL_RESOLUTION_MAX) return normalizeHue(hue);
  const steps = hueStepCount(resolution);
  if (!steps) return normalizeHue(hue);
  const stepAngle = 360 / steps;
  const h = normalizeHue(hue);
  const segmentIndex = Math.min(steps - 1, Math.floor(h / stepAngle));
  return normalizeHue(segmentIndex * stepAngle + stepAngle / 2);
}

const DISC_INSET = 10;

function radialBandInnerRadius(step: number, maxRadius: number): number {
  return (step / RADIAL_BRIGHTNESS_STEPS) * maxRadius;
}

function radialBandOuterRadius(step: number, maxRadius: number): number {
  return ((step + 1) / RADIAL_BRIGHTNESS_STEPS) * maxRadius;
}

function radialStepFromDistance(distance: number, maxRadius: number): number {
  if (maxRadius <= 0) return 0;
  const t = clamp(distance / maxRadius, 0, 1);
  return clamp(
    Math.min(RADIAL_BRIGHTNESS_STEPS - 1, Math.floor(t * RADIAL_BRIGHTNESS_STEPS)),
    0,
    RADIAL_BRIGHTNESS_STEPS - 1,
  );
}

function brightnessToRadialStep(brightness: number): number {
  const t = (brightness - BRIGHTNESS_MIN) / (BRIGHTNESS_MAX - BRIGHTNESS_MIN);
  return clamp(
    Math.min(RADIAL_BRIGHTNESS_STEPS - 1, Math.floor(t * RADIAL_BRIGHTNESS_STEPS)),
    0,
    RADIAL_BRIGHTNESS_STEPS - 1,
  );
}

function radialStepToBrightness(step: number): number {
  return Math.round(
    BRIGHTNESS_MIN + (step / (RADIAL_BRIGHTNESS_STEPS - 1)) * (BRIGHTNESS_MAX - BRIGHTNESS_MIN),
  );
}

function radialStepToRadius(step: number, maxRadius: number): number {
  return ((step + 0.5) / RADIAL_BRIGHTNESS_STEPS) * maxRadius;
}

function brightnessFromPointerDistanceContinuous(distance: number, maxRadius: number): number {
  const t = clamp(distance / maxRadius, 0, 1);
  return Math.round(BRIGHTNESS_MIN + t * (BRIGHTNESS_MAX - BRIGHTNESS_MIN));
}

function discMetricsFromRect(rect: DOMRect) {
  const scale = rect.width / DISC_SIZE;
  return {
    centerX: rect.width / 2,
    centerY: rect.height / 2,
    maxRadius: (DISC_SIZE / 2 - DISC_INSET) * scale,
  };
}

function wheelBrightnessForMode(brightness: number, isSteppedWheel: boolean): number {
  if (!isSteppedWheel) return brightness;
  return radialStepToBrightness(brightnessToRadialStep(brightness));
}

function ringMaskStyle(innerRadius: number, outerRadius: number): CSSProperties {
  return {
    mask: `radial-gradient(circle at center, transparent ${innerRadius}px, #000 ${innerRadius}px, #000 ${outerRadius}px, transparent ${outerRadius}px)`,
    WebkitMask: `radial-gradient(circle at center, transparent ${innerRadius}px, #000 ${innerRadius}px, #000 ${outerRadius}px, transparent ${outerRadius}px)`,
  };
}

function steppedHueConic(brightness: number, saturation: number, resolution: number): string {
  const steps = hueStepCount(resolution) ?? 3;
  const stepAngle = 360 / steps;
  const stops: string[] = [];
  for (let i = 0; i < steps; i++) {
    const start = i * stepAngle;
    const end = (i + 1) * stepAngle;
    const segmentHue = start + stepAngle / 2;
    stops.push(`hsl(${segmentHue}, ${saturation}%, ${brightness}%) ${start}deg ${end}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(', ')})`;
}

function smoothDiscBackground(brightness: number, saturation: number): string {
  const wash = (100 - saturation) / 100;
  return `linear-gradient(hsla(0, 0%, ${brightness}%, ${wash * 0.75})), radial-gradient(circle, hsl(0, 0%, ${brightness}%) 0%, transparent 68%), ${HUE_CONIC}`;
}

function wheelResolutionLabel(resolution: number): string {
  if (resolution >= WHEEL_RESOLUTION_MAX) return 'Smooth';
  const steps = hueStepCount(resolution);
  return steps ? `${resolution}% · ${steps} steps` : `${resolution}%`;
}

function discPositionFromPolar(
  hue: number,
  radius: number,
  center: number,
) {
  const radians = ((hue - 90) * Math.PI) / 180;
  return {
    x: center + Math.cos(radians) * radius,
    y: center + Math.sin(radians) * radius,
  };
}

function brightnessToRadiusContinuous(brightness: number, maxRadius: number): number {
  const t = (brightness - BRIGHTNESS_MIN) / (BRIGHTNESS_MAX - BRIGHTNESS_MIN);
  return t * maxRadius;
}

function discPositionSmooth(hue: number, brightness: number, center: number, maxRadius: number) {
  const radius = brightnessToRadiusContinuous(brightness, maxRadius);
  return discPositionFromPolar(hue, radius, center);
}

function dotPositionOnDisc(
  hue: number,
  brightness: number,
  resolution: number,
  center: number,
  maxRadius: number,
) {
  const displayHue = quantizeHueToWheelResolution(hue, resolution);
  if (resolution >= WHEEL_RESOLUTION_MAX) {
    return discPositionSmooth(displayHue, brightness, center, maxRadius);
  }
  const radius = radialStepToRadius(brightnessToRadialStep(brightness), maxRadius);
  return discPositionFromPolar(displayHue, radius, center);
}

function saturationColumnGradient(hue: number, brightness: number): string {
  return `linear-gradient(to top, hsl(${hue}, 0%, ${brightness}%), hsl(${hue}, 100%, ${brightness}%)`;
}

function SteppedDiscBackground({
  maxRadius,
  resolution,
  saturation,
}: {
  maxRadius: number;
  resolution: number;
  saturation: number;
}) {
  return (
    <>
      {Array.from({ length: RADIAL_BRIGHTNESS_STEPS }, (_, step) => {
        const innerRadius = radialBandInnerRadius(step, maxRadius);
        const outerRadius = radialBandOuterRadius(step, maxRadius);
        const ringBrightness = radialStepToBrightness(step);
        return (
          <div
            key={`radial-${step}`}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: steppedHueConic(ringBrightness, saturation, resolution),
              ...ringMaskStyle(innerRadius, outerRadius),
            }}
          />
        );
      })}
    </>
  );
}

export interface IntegratedColorPickerProps {
  hue: number;
  saturation: number;
  brightness: number;
  accentHues: number[];
  selectedAccentHue: number | null;
  onAccentSelect?: (hue: number) => void;
  onChange: (next: { hue?: number; saturation?: number; brightness?: number; accentHue?: null }) => void;
}

export function IntegratedColorPicker({
  hue,
  saturation,
  brightness,
  accentHues,
  selectedAccentHue,
  onAccentSelect,
  onChange,
}: IntegratedColorPickerProps) {
  const discRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [wheelResolution, setWheelResolution] = useState(DEFAULT_WHEEL_RESOLUTION);
  const center = DISC_SIZE / 2;
  const maxRadius = center - DISC_INSET;
  const pickerWidth = DISC_SIZE + 12 + SLIDER_WIDTH;
  const isSteppedWheel = wheelResolution < WHEEL_RESOLUTION_MAX;
  const wheelBrightness = wheelBrightnessForMode(brightness, isSteppedWheel);

  const harmonyHues = useMemo(
    () => harmonyVariationHues(hue, accentHues),
    [hue, accentHues],
  );

  const normalizedAccents = useMemo(
    () => accentHues.map(normalizeHue).filter((accent) => accent !== normalizeHue(hue)),
    [accentHues, hue],
  );

  const selectedVariation = useMemo(
    () => findClosestHarmonyVariation(saturation, brightness),
    [saturation, brightness],
  );

  const dominantPosition = dotPositionOnDisc(
    hue,
    wheelBrightness,
    wheelResolution,
    center,
    maxRadius,
  );
  const saturationThumbTopPercent = (1 - saturation / 100) * 100;
  const displayHue = quantizeHueToWheelResolution(hue, wheelResolution);

  const updateDiscFromPointer = (clientX: number, clientY: number) => {
    const el = discRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const { centerX, centerY, maxRadius: pointerMaxRadius } = discMetricsFromRect(rect);
    const dx = localX - centerX;
    const dy = localY - centerY;
    const distance = Math.hypot(dx, dy);
    const rawAngle = normalizeHue(Math.atan2(dy, dx) * (180 / Math.PI) + 90);

    if (isSteppedWheel) {
      const radialStep = radialStepFromDistance(distance, pointerMaxRadius);
      onChange({
        hue: quantizeHueToWheelResolution(rawAngle, wheelResolution),
        brightness: radialStepToBrightness(radialStep),
        accentHue: null,
      });
      return;
    }

    onChange({
      hue: rawAngle,
      brightness: brightnessFromPointerDistanceContinuous(distance, pointerMaxRadius),
      accentHue: null,
    });
  };

  const updateSaturationFromPointer = (clientY: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    onChange({ saturation: Math.round(ratio * 100) });
  };

  const snapToSteppedWheel = (nextResolution: number) => {
    if (nextResolution >= WHEEL_RESOLUTION_MAX) return;
    onChange({
      hue: quantizeHueToWheelResolution(hue, nextResolution),
      brightness: radialStepToBrightness(brightnessToRadialStep(brightness)),
    });
  };

  return (
    <div className="flex items-start gap-6">
      <div className="shrink-0 rounded-lg border border-surface-600 bg-surface-900/40 p-3 flex flex-col items-center gap-3">
        <div className="flex items-stretch gap-3">
          <div
            ref={discRef}
            className="relative shrink-0 rounded-full cursor-crosshair select-none touch-none overflow-hidden border border-surface-600"
            style={{
              width: DISC_SIZE,
              height: DISC_SIZE,
              background: isSteppedWheel ? undefined : smoothDiscBackground(wheelBrightness, saturation),
            }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateDiscFromPointer(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              updateDiscFromPointer(event.clientX, event.clientY);
            }}
          >
            {isSteppedWheel && (
              <SteppedDiscBackground
                maxRadius={maxRadius}
                resolution={wheelResolution}
                saturation={saturation}
              />
            )}

            {normalizedAccents.map((accentHue) => {
              const isSelected = selectedAccentHue === accentHue;
              const position = dotPositionOnDisc(
                accentHue,
                wheelBrightness,
                wheelResolution,
                center,
                maxRadius,
              );
              const accentDisplayHue = quantizeHueToWheelResolution(accentHue, wheelResolution);
              const thumbSize = isSelected ? 14 : 11;
              return (
                <button
                  key={`accent-${accentHue}`}
                  type="button"
                  className={`absolute rounded-full border-2 shadow-sm transition-transform hover:scale-110 z-10 ${
                    isSelected
                      ? 'border-brand-400 ring-2 ring-brand-500/50'
                      : 'border-white/80'
                  }`}
                  style={{
                    width: thumbSize,
                    height: thumbSize,
                    left: position.x - thumbSize / 2,
                    top: position.y - thumbSize / 2,
                    background: `hsl(${accentDisplayHue}, ${saturation}%, ${wheelBrightness}%)`,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAccentSelect?.(accentHue);
                  }}
                  aria-label={`Accent hue ${Math.round(accentHue)} degrees`}
                />
              );
            })}

            <div
              className="absolute rounded-full border-2 border-white shadow-md pointer-events-none z-20"
              style={{
                width: 16,
                height: 16,
                left: dominantPosition.x - 8,
                top: dominantPosition.y - 8,
                background: `hsl(${displayHue}, ${saturation}%, ${wheelBrightness}%)`,
              }}
            />
          </div>

          <SaturationHarmonySlider
            sliderRef={sliderRef}
            hues={harmonyHues}
            saturation={saturation}
            brightness={wheelBrightness}
            thumbTopPercent={saturationThumbTopPercent}
            onPointerDown={(clientY) => updateSaturationFromPointer(clientY)}
            onPointerMove={(clientY) => updateSaturationFromPointer(clientY)}
          />
        </div>

        <div style={{ width: pickerWidth }}>
          <RangeSlider
            label="Wheel Resolution"
            valueLabel={wheelResolutionLabel(wheelResolution)}
            min={WHEEL_RESOLUTION_MIN}
            max={WHEEL_RESOLUTION_MAX}
            value={wheelResolution}
            onChange={(event) => {
              const nextResolution = parseInt(event.target.value, 10);
              setWheelResolution(nextResolution);
              snapToSteppedWheel(nextResolution);
            }}
          />
        </div>

        <div className="space-y-1 text-center w-full" style={{ maxWidth: pickerWidth }}>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Dominant</p>
          <p className="text-sm font-medium text-brand-400 capitalize">{hueToColorName(hue)}</p>
          <p className="text-xs text-gray-500">
            {Math.round(hue)}° · Sat {Math.round(saturation)}% · Bri {Math.round(wheelBrightness)}%
          </p>
        </div>
      </div>

      <div className="min-w-0 flex-1 grid grid-cols-3 gap-3">
        {VARIATION_CATEGORIES.map((category) => {
          const variations = HARMONY_VARIATIONS.filter((variation) => variation.category === category);
          return (
            <div
              key={category}
              className="min-w-0 m-0 rounded-lg border border-surface-600 bg-surface-900/40 p-1 flex flex-col gap-1"
            >
              <p className="text-[10px] text-gray-500 uppercase tracking-wider m-0 text-center">
                {HARMONY_VARIATION_CATEGORY_LABELS[category]}
              </p>
              <div className="flex flex-col gap-1.5 m-0">
                {variations.map((variation) => (
                  <HarmonyVariationOption
                    key={variation.id}
                    variation={variation}
                    hues={harmonyHues}
                    selected={selectedVariation.id === variation.id}
                    onSelect={() =>
                      onChange({
                        saturation: variation.saturation,
                        brightness: isSteppedWheel
                          ? radialStepToBrightness(brightnessToRadialStep(variation.brightness))
                          : variation.brightness,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SaturationHarmonySlider({
  sliderRef,
  hues,
  saturation,
  brightness,
  thumbTopPercent,
  onPointerDown,
  onPointerMove,
}: {
  sliderRef: React.RefObject<HTMLDivElement | null>;
  hues: number[];
  saturation: number;
  brightness: number;
  thumbTopPercent: number;
  onPointerDown: (clientY: number) => void;
  onPointerMove: (clientY: number) => void;
}) {
  return (
    <div
      ref={sliderRef}
      className="relative shrink-0 cursor-ns-resize select-none touch-none rounded-lg overflow-hidden border border-surface-600"
      style={{ width: SLIDER_WIDTH, height: DISC_SIZE }}
      role="slider"
      aria-label="Saturation"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(saturation)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onPointerDown(event.clientY);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        onPointerMove(event.clientY);
      }}
    >
      <div className="absolute inset-0 flex">
        {hues.map((harmonyHue) => (
          <div
            key={`sat-col-${harmonyHue}`}
            className="h-full flex-1 min-w-0"
            style={{ background: saturationColumnGradient(harmonyHue, brightness) }}
          />
        ))}
      </div>
      <div
        className="absolute left-0 right-0 h-3 -mt-1.5 rounded-sm border-2 border-white shadow-md pointer-events-none z-10"
        style={{
          top: `${thumbTopPercent}%`,
          background: `hsl(${hues[0]}, ${saturation}%, ${brightness}%)`,
        }}
      />
    </div>
  );
}

function HarmonyVariationOption({
  variation,
  hues,
  selected,
  onSelect,
}: {
  variation: HarmonyVariation;
  hues: number[];
  selected: boolean;
  onSelect: () => void;
}) {
  const swatches = harmonyVariationSwatchColors(hues, variation);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors ${
        selected
          ? 'border-brand-400 bg-brand-500/10'
          : 'border-surface-600 bg-surface-900/50 hover:border-surface-500'
      }`}
      aria-label={`${variation.label} ${HARMONY_VARIATION_CATEGORY_LABELS[variation.category]} harmony`}
      aria-pressed={selected}
    >
      <div className="flex gap-0.5">
        {swatches.map((color, index) => (
          <span
            key={`${variation.id}-${index}`}
            className="h-5 w-5 first:rounded-l-sm last:rounded-r-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <span className={`text-[10px] ${selected ? 'text-brand-300' : 'text-gray-500 group-hover:text-gray-400'}`}>
        {variation.label}
      </span>
    </button>
  );
}
