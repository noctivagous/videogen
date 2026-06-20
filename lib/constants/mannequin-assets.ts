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

/** Per-age art exists at correct proportions — no extra scale multiplier. */
export const MANNEQUIN_AGE_SCALE: Record<MannequinAge, number> = {
  adult: 1.0,
  teen: 1.0,
  child: 1.0,
};

const ANGLE_FILES: Record<MannequinAngle, string> = {
  front: 'front.png',
  threeQuarterLeft: 'three-quarter-left.png',
  threeQuarterRight: 'three-quarter-right.png',
  left: 'left-profile.png',
  rearThreeQuarterLeft: 'rear-three-quarter-left.png',
  right: 'right-profile.png',
  rearThreeQuarterRight: 'rear-three-quarter-right.png',
  back: 'back.png',
};

export function resolveMannequinArtAge(age: MannequinAge): MannequinAge {
  return age;
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
  'female-adult-standard-back': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4983 },
  'female-adult-standard-front': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9892, feetCenterX: 0.4967 },
  'female-adult-standard-left': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4977 },
  'female-adult-standard-rearThreeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4982 },
  'female-adult-standard-rearThreeQuarterRight': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4982 },
  'female-adult-standard-right': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9892, feetCenterX: 0.4974 },
  'female-adult-standard-threeQuarterLeft': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.5 },
  'female-adult-standard-threeQuarterRight': { paddingBottom: 0.0068, paddingTop: 0.0059, contentHeightRatio: 0.9873, feetCenterX: 0.5 },
  'female-child-standard-back': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4969 },
  'female-child-standard-front': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4984 },
  'female-child-standard-left': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.498 },
  'female-child-standard-rearThreeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'female-child-standard-rearThreeQuarterRight': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4982 },
  'female-child-standard-right': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4981 },
  'female-child-standard-threeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4966 },
  'female-child-standard-threeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4968 },
  'female-teen-standard-back': { paddingBottom: 0.0059, paddingTop: 0.0049, contentHeightRatio: 0.9893, feetCenterX: 0.4968 },
  'female-teen-standard-front': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4966 },
  'female-teen-standard-left': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'female-teen-standard-rearThreeQuarterLeft': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4981 },
  'female-teen-standard-rearThreeQuarterRight': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4981 },
  'female-teen-standard-right': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4977 },
  'female-teen-standard-threeQuarterLeft': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4982 },
  'female-teen-standard-threeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0049, contentHeightRatio: 0.9892, feetCenterX: 0.5 },
  'male-adult-standard-back': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.5 },
  'male-adult-standard-front': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'male-adult-standard-left': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4977 },
  'male-adult-standard-rearThreeQuarterLeft': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9892, feetCenterX: 0.4984 },
  'male-adult-standard-rearThreeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4983 },
  'male-adult-standard-right': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4952 },
  'male-adult-standard-threeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4984 },
  'male-adult-standard-threeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'male-child-standard-back': { paddingBottom: 0.0059, paddingTop: 0.0049, contentHeightRatio: 0.9893, feetCenterX: 0.4986 },
  'male-child-standard-front': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4985 },
  'male-child-standard-left': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4957 },
  'male-child-standard-rearThreeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4983 },
  'male-child-standard-rearThreeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4983 },
  'male-child-standard-right': { paddingBottom: 0.0059, paddingTop: 0.0049, contentHeightRatio: 0.9893, feetCenterX: 0.4979 },
  'male-child-standard-threeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4983 },
  'male-child-standard-threeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4969 },
  'male-teen-standard-back': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'male-teen-standard-front': { paddingBottom: 0.0059, paddingTop: 0.0049, contentHeightRatio: 0.9893, feetCenterX: 0.4984 },
  'male-teen-standard-left': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4958 },
  'male-teen-standard-rearThreeQuarterLeft': { paddingBottom: 0.0049, paddingTop: 0.0059, contentHeightRatio: 0.9893, feetCenterX: 0.4983 },
  'male-teen-standard-rearThreeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.5 },
  'male-teen-standard-right': { paddingBottom: 0.0049, paddingTop: 0.0049, contentHeightRatio: 0.9902, feetCenterX: 0.4978 },
  'male-teen-standard-threeQuarterLeft': { paddingBottom: 0.0059, paddingTop: 0.0049, contentHeightRatio: 0.9893, feetCenterX: 0.4965 },
  'male-teen-standard-threeQuarterRight': { paddingBottom: 0.0059, paddingTop: 0.0059, contentHeightRatio: 0.9883, feetCenterX: 0.4983 },
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
  const ages: MannequinAge[] = ['adult', 'teen', 'child'];
  const loads: Promise<HTMLImageElement>[] = [];
  for (const gender of genders) {
    for (const age of ages) {
      for (const angle of MANNEQUIN_ANGLES) {
        loads.push(
          loadImage(
            mannequinAssetPath({ gender, age, pose: 'standard', angle }),
          ),
        );
      }
    }
  }
  return Promise.all(loads).then(() => undefined);
}

export function loadMannequinImage(mannequin: Pick<Mannequin, 'gender' | 'age' | 'pose' | 'angle'>): Promise<HTMLImageElement> {
  return loadImage(mannequinAssetPath(mannequinVariantFrom(mannequin)));
}