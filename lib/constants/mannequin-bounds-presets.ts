// Generated from subject cutout alpha bounds at 16:9 center placement.
// Regenerate: npm run generate:mannequin-bounds-presets

import type { MannequinBoundsFrame } from '@/lib/studio/mannequin-bounds-framing';
import type { FieldSize, MannequinAge, MannequinGender } from '@/lib/types/studio';

export type MannequinBoundsPreset = Pick<MannequinBoundsFrame, 'insetLeft' | 'insetTop' | 'widthToFrameHeight'>;
export type MannequinDemographicKey = `${MannequinGender}-${MannequinAge}`;

export const MANNEQUIN_DEMOGRAPHICS: MannequinDemographicKey[] = [
  'male-adult',
  'male-teen',
  'male-child',
  'female-adult',
  'female-teen',
  'female-child',
];

export function mannequinDemographicKey(gender: MannequinGender, age: MannequinAge): MannequinDemographicKey {
  return `${gender}-${age}`;
}

export const FIELD_SIZE_BOUNDS_PRESETS: Record<FieldSize, Record<MannequinDemographicKey, MannequinBoundsPreset>> = {
  'ecu': {
    'male-adult': { insetLeft: -0.19, insetTop: -0.163, widthToFrameHeight: 3 },
    'male-teen': { insetLeft: -0.3, insetTop: 0, widthToFrameHeight: 3 },
    'male-child': { insetLeft: -0.3, insetTop: 0, widthToFrameHeight: 3 },
    'female-adult': { insetLeft: -0.3, insetTop: 0, widthToFrameHeight: 3 },
    'female-teen': { insetLeft: -0.3, insetTop: 0, widthToFrameHeight: 3 },
    'female-child': { insetLeft: -0.3, insetTop: 0, widthToFrameHeight: 3 },
  },
  'cu': {
    'male-adult': { insetLeft: 0.2, insetTop: 0.025, widthToFrameHeight: 1.7 },
    'male-teen': { insetLeft: 0.2, insetTop: 0.025, widthToFrameHeight: 1.7 },
    'male-child': { insetLeft: 0.2, insetTop: 0.025, widthToFrameHeight: 1.7 },
    'female-adult': { insetLeft: 0.2, insetTop: 0.040278, widthToFrameHeight: 1.7 },
    'female-teen': { insetLeft: 0.2, insetTop: 0.040278, widthToFrameHeight: 1.7 },
    'female-child': { insetLeft: 0.2, insetTop: 0.040278, widthToFrameHeight: 1.7 },
  },
  'mcu': {
    'male-adult': { insetLeft: 0.290625, insetTop: 0.0, widthToFrameHeight: 0.987 },
    'male-teen': { insetLeft: 0.290625, insetTop: 0.058333, widthToFrameHeight: 0.987 },
    'male-child': { insetLeft: 0.290625, insetTop: 0.058333, widthToFrameHeight: 0.987 },
    'female-adult': { insetLeft: 0.251563, insetTop: 0.05, widthToFrameHeight: 0.987 },
    'female-teen': { insetLeft: 0.251563, insetTop: 0.05, widthToFrameHeight: 0.987 },
    'female-child': { insetLeft: 0.251563, insetTop: 0.05, widthToFrameHeight: 0.987 },
  },
  'close-shot': {
    'male-adult': { insetLeft: 0.19375, insetTop: 0.051389, widthToFrameHeight: 1.148611 },
    'male-teen': { insetLeft: 0.19375, insetTop: 0.051389, widthToFrameHeight: 1.148611 },
    'male-child': { insetLeft: 0.19375, insetTop: 0.051389, widthToFrameHeight: 1.148611 },
    'female-adult': { insetLeft: 0.251563, insetTop: 0.05, widthToFrameHeight: 0.905556 },
    'female-teen': { insetLeft: 0.251563, insetTop: 0.05, widthToFrameHeight: 0.905556 },
    'female-child': { insetLeft: 0.251563, insetTop: 0.05, widthToFrameHeight: 0.905556 },
  },
  'ms': {
    'male-adult': { insetLeft: 0.344375, insetTop: 0.0625, widthToFrameHeight: 0.695833 },
    'male-teen': { insetLeft: 0.334375, insetTop: 0.0625, widthToFrameHeight: 0.595833 },
    'male-child': { insetLeft: 0.334375, insetTop: 0.0625, widthToFrameHeight: 0.595833 },
    'female-adult': { insetLeft: 0.346094, insetTop: 0.048611, widthToFrameHeight: 0.556944 },
    'female-teen': { insetLeft: 0.346094, insetTop: 0.048611, widthToFrameHeight: 0.556944 },
    'female-child': { insetLeft: 0.346094, insetTop: 0.048611, widthToFrameHeight: 0.556944 },
  },
  'fs': {
    'male-adult': { insetLeft: 0.422656, insetTop: 0.059722, widthToFrameHeight: 0.315 },
    'male-teen': { insetLeft: 0.422656, insetTop: 0.059722, widthToFrameHeight: 0.275 },
    'male-child': { insetLeft: 0.422656, insetTop: 0.059722, widthToFrameHeight: 0.275 },
    'female-adult': { insetLeft: 0.430469, insetTop: 0.051389, widthToFrameHeight: 0.244444 },
    'female-teen': { insetLeft: 0.430469, insetTop: 0.051389, widthToFrameHeight: 0.244444 },
    'female-child': { insetLeft: 0.430469, insetTop: 0.051389, widthToFrameHeight: 0.244444 },
  },
  'ls': {
    'male-adult': { insetLeft: 0.422656, insetTop: 0.059722, widthToFrameHeight: 0.275 },
    'male-teen': { insetLeft: 0.422656, insetTop: 0.059722, widthToFrameHeight: 0.275 },
    'male-child': { insetLeft: 0.422656, insetTop: 0.059722, widthToFrameHeight: 0.275 },
    'female-adult': { insetLeft: 0.430469, insetTop: 0.051389, widthToFrameHeight: 0.244444 },
    'female-teen': { insetLeft: 0.430469, insetTop: 0.051389, widthToFrameHeight: 0.244444 },
    'female-child': { insetLeft: 0.430469, insetTop: 0.051389, widthToFrameHeight: 0.244444 },
  },
  'els': {
    'male-adult': { insetLeft: 0.451562, insetTop: 0.231944, widthToFrameHeight: 0.168056 },
    'male-teen': { insetLeft: 0.451562, insetTop: 0.231944, widthToFrameHeight: 0.168056 },
    'male-child': { insetLeft: 0.451562, insetTop: 0.231944, widthToFrameHeight: 0.168056 },
    'female-adult': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-teen': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-child': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
  },
  'vls': {
    'male-adult': { insetLeft: 0.473438, insetTop: 0.355556, widthToFrameHeight: 0.0875 },
    'male-teen': { insetLeft: 0.473438, insetTop: 0.355556, widthToFrameHeight: 0.0875 },
    'male-child': { insetLeft: 0.473438, insetTop: 0.355556, widthToFrameHeight: 0.0875 },
    'female-adult': { insetLeft: 0.476563, insetTop: 0.3625, widthToFrameHeight: 0.073611 },
    'female-teen': { insetLeft: 0.476563, insetTop: 0.3625, widthToFrameHeight: 0.073611 },
    'female-child': { insetLeft: 0.476563, insetTop: 0.3625, widthToFrameHeight: 0.073611 },
  },
  'ws': {
    'male-adult': { insetLeft: 0.4625, insetTop: 0.3, widthToFrameHeight: 0.126389 },
    'male-teen': { insetLeft: 0.4625, insetTop: 0.3, widthToFrameHeight: 0.126389 },
    'male-child': { insetLeft: 0.4625, insetTop: 0.3, widthToFrameHeight: 0.126389 },
    'female-adult': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-teen': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-child': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
  },
  'mws': {
    'male-adult': { insetLeft: 0.373437, insetTop: 0.058333, widthToFrameHeight: 0.448611 },
    'male-teen': { insetLeft: 0.373437, insetTop: 0.058333, widthToFrameHeight: 0.448611 },
    'male-child': { insetLeft: 0.373437, insetTop: 0.058333, widthToFrameHeight: 0.448611 },
    'female-adult': { insetLeft: 0.385156, insetTop: 0.0625, widthToFrameHeight: 0.406944 },
    'female-teen': { insetLeft: 0.385156, insetTop: 0.0625, widthToFrameHeight: 0.406944 },
    'female-child': { insetLeft: 0.385156, insetTop: 0.0625, widthToFrameHeight: 0.406944 },
  },
  'bcu': {
    'male-adult': { insetLeft: 0.291406, insetTop: 0, widthToFrameHeight: 0.7875 },
    'male-teen': { insetLeft: 0.291406, insetTop: 0, widthToFrameHeight: 0.7875 },
    'male-child': { insetLeft: 0.291406, insetTop: 0, widthToFrameHeight: 0.7875 },
    'female-adult': { insetLeft: 0.250781, insetTop: 0, widthToFrameHeight: 0.866667 },
    'female-teen': { insetLeft: 0.250781, insetTop: 0, widthToFrameHeight: 0.866667 },
    'female-child': { insetLeft: 0.250781, insetTop: 0, widthToFrameHeight: 0.866667 },
  },
  'xls': {
    'male-adult': { insetLeft: 0.451562, insetTop: 0.231944, widthToFrameHeight: 0.168056 },
    'male-teen': { insetLeft: 0.451562, insetTop: 0.231944, widthToFrameHeight: 0.168056 },
    'male-child': { insetLeft: 0.451562, insetTop: 0.231944, widthToFrameHeight: 0.168056 },
    'female-adult': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-teen': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-child': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
  },
  'cowboy': {
    'male-adult': { insetLeft: 0.373437, insetTop: 0.058333, widthToFrameHeight: 0.448611 },
    'male-teen': { insetLeft: 0.373437, insetTop: 0.058333, widthToFrameHeight: 0.448611 },
    'male-child': { insetLeft: 0.373437, insetTop: 0.058333, widthToFrameHeight: 0.448611 },
    'female-adult': { insetLeft: 0.346094, insetTop: 0.048611, widthToFrameHeight: 0.556944 },
    'female-teen': { insetLeft: 0.346094, insetTop: 0.048611, widthToFrameHeight: 0.556944 },
    'female-child': { insetLeft: 0.346094, insetTop: 0.048611, widthToFrameHeight: 0.556944 },
  },
  'ch': {
    'male-adult': { insetLeft: 0.259375, insetTop: 0, widthToFrameHeight: 0.883333 },
    'male-teen': { insetLeft: 0.259375, insetTop: 0, widthToFrameHeight: 0.883333 },
    'male-child': { insetLeft: 0.259375, insetTop: 0, widthToFrameHeight: 0.883333 },
    'female-adult': { insetLeft: 0, insetTop: 0, widthToFrameHeight: 1.777778 },
    'female-teen': { insetLeft: 0, insetTop: 0, widthToFrameHeight: 1.777778 },
    'female-child': { insetLeft: 0, insetTop: 0, widthToFrameHeight: 1.777778 },
  },
  'gv': {
    'male-adult': { insetLeft: 0.4625, insetTop: 0.3, widthToFrameHeight: 0.126389 },
    'male-teen': { insetLeft: 0.4625, insetTop: 0.3, widthToFrameHeight: 0.126389 },
    'male-child': { insetLeft: 0.4625, insetTop: 0.3, widthToFrameHeight: 0.126389 },
    'female-adult': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-teen': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
    'female-child': { insetLeft: 0.463281, insetTop: 0.283333, widthToFrameHeight: 0.119444 },
  },
};

export function boundsPresetForDemographic(
  fieldSize: FieldSize,
  gender: MannequinGender,
  age: MannequinAge,
): MannequinBoundsPreset {
  return FIELD_SIZE_BOUNDS_PRESETS[fieldSize][mannequinDemographicKey(gender, age)];
}
