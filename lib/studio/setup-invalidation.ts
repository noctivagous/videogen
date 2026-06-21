import { mannequinLayoutInvalidationPatch } from '@/lib/studio/mannequin-sync';
import type { CoverageShot, Setup } from '@/lib/types/studio';

/** Mark bake outputs stale on every coverage shot in a setup (shared lighting/sheets changed). */
export function invalidateSetupCoverageBakes(setups: Setup[], setupId: number): Setup[] {
  return setups.map((setup) => {
    if (setup.id !== setupId) return setup;
    return {
      ...setup,
      shots: setup.shots.map((coverage) => invalidateCoverageBake(coverage)),
    };
  });
}

/** Invalidate coverage shots that reference a specific backdrop plate. */
export function invalidateCoverageForBackdrop(
  setups: Setup[],
  setupId: number,
  backdropId: string,
): Setup[] {
  return setups.map((setup) => {
    if (setup.id !== setupId) return setup;
    return {
      ...setup,
      shots: setup.shots.map((coverage) =>
        coverage.backdropId === backdropId ? invalidateCoverageBake(coverage) : coverage,
      ),
    };
  });
}

function invalidateCoverageBake(coverage: CoverageShot): CoverageShot {
  if (coverage.bakeStatus !== 'ready' && !coverage.bakedStartFrame) {
    return coverage;
  }
  return {
    ...coverage,
    ...mannequinLayoutInvalidationPatch(),
    bakeStatus: 'idle',
    bakedStartFrame: null,
    bakedIntermediateFrame: null,
  };
}

export function mergeSetupInvalidationIntoPatch(
  setups: Setup[],
  setupId: number,
  patch: Partial<Setup>,
): Setup[] {
  const needsBakeInvalidation =
    patch.lighting !== undefined ||
    patch.references !== undefined ||
    patch.transformedReferences !== undefined ||
    patch.sceneSetup !== undefined;

  let next = setups.map((setup) =>
    setup.id === setupId ? { ...setup, ...patch } : setup,
  );
  if (needsBakeInvalidation) {
    next = invalidateSetupCoverageBakes(next, setupId);
  }
  return next;
}
