import type {
  Mannequin,
  MannequinAge,
  MannequinAngle,
  MannequinGender,
  MannequinPose,
} from '@/lib/types/studio';

/** Alpha-bbox trim for placement PNGs — feet sit above the image bottom. */
export interface MannequinTrim {
  paddingBottom: number;
  paddingTop: number;
  contentHeightRatio: number;
  feetCenterX: number;
}

export interface MannequinVariant {
  gender: MannequinGender;
  age: MannequinAge;
  pose: MannequinPose;
  angle: MannequinAngle;
}

export const MANNEQUIN_AGE_SCALE: Record<MannequinAge, number> = {
  adult: 1.0,
  teen: 0.9,
  child: 0.75,
};

const ANGLE_FILES: Record<MannequinAngle, string> = {
  front: 'front.png',
  threeQuarterLeft: 'three-quarter-left.png',
  threeQuarterRight: 'three-quarter-right.png',
  left: 'left-profile.png',
  right: 'right-profile.png',
  back: 'back.png',
};

/** Art tier — teen/child reuse adult PNGs with ageScale multiplier. */
export function resolveMannequinArtAge(age: MannequinAge): 'adult' {
  return 'adult';
}

export function mannequinAssetId(variant: MannequinVariant): string {
  const artAge = resolveMannequinArtAge(variant.age);
  return `${variant.gender}-${artAge}-${variant.pose}-${variant.angle}`;
}

export function mannequinVariantFrom(
  mannequin: Partial<Pick<Mannequin, 'gender' | 'age' | 'pose' | 'ageScale'>> &
    Pick<Mannequin, 'angle'>,
): MannequinVariant {
  let age: MannequinAge = mannequin.age ?? 'adult';
  if (!mannequin.age && mannequin.ageScale != null) {
    if (mannequin.ageScale <= 0.8) age = 'child';
    else if (mannequin.ageScale < 1) age = 'teen';
  }
  return {
    gender: mannequin.gender ?? 'male',
    age,
    pose: mannequin.pose ?? 'standard',
    angle: mannequin.angle,
  };
}

export function mannequinAgeScale(age: MannequinAge): number {
  return MANNEQUIN_AGE_SCALE[age];
}

export function mannequinEffectiveAgeScale(mannequin: Pick<Mannequin, 'age' | 'ageScale'>): number {
  if (mannequin.age) return mannequinAgeScale(mannequin.age);
  return mannequin.ageScale ?? 1;
}

const MANNEQUIN_TRIM: Record<string, MannequinTrim> = {
  'male-adult-standard-front': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'male-adult-standard-threeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4984 },
  'male-adult-standard-threeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'male-adult-standard-left': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4977 },
  'male-adult-standard-right': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4952 },
  'male-adult-standard-back': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.5 },
  'female-adult-standard-front': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9892, feetCenterX: 0.4967 },
  'female-adult-standard-threeQuarterLeft': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.5 },
  'female-adult-standard-threeQuarterRight': { paddingBottom: 0.0068, paddingTop: 0.0059, contentHeightRatio: 0.9873, feetCenterX: 0.5 },
  'female-adult-standard-left': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4977 },
  'female-adult-standard-right': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.5 },
  'female-adult-standard-back': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4983 },
};

export const MANNEQUIN_ANGLES = Object.keys(ANGLE_FILES) as MannequinAngle[];

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function mannequinAssetPath(variant: MannequinVariant): string {
  const artAge = resolveMannequinArtAge(variant.age);
  const file = ANGLE_FILES[variant.angle];
  return `/mannequins/${variant.gender}/${artAge}/${variant.pose}/${file}`;
}

export function mannequinTrim(variant: MannequinVariant): MannequinTrim {
  const id = mannequinAssetId(variant);
  return (
    MANNEQUIN_TRIM[id] ?? {
      paddingBottom: 0.006,
      paddingTop: 0.006,
      contentHeightRatio: 0.988,
      feetCenterX: 0.5,
    }
  );
}

export function applyAgeScale(scale: number, ageScale: number): number {
  return scale * ageScale;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load mannequin asset: ${src}`));
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

export function preloadMannequinAssets(): Promise<void> {
  const genders: MannequinGender[] = ['male', 'female'];
  const loads: Promise<HTMLImageElement>[] = [];
  for (const gender of genders) {
    for (const angle of MANNEQUIN_ANGLES) {
      loads.push(
        loadImage(
          mannequinAssetPath({ gender, age: 'adult', pose: 'standard', angle }),
        ),
      );
    }
  }
  return Promise.all(loads).then(() => undefined);
}

export function loadMannequinImage(mannequin: Pick<Mannequin, 'gender' | 'age' | 'pose' | 'angle'>): Promise<HTMLImageElement> {
  return loadImage(mannequinAssetPath(mannequinVariantFrom(mannequin)));
}