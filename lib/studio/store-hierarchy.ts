import { STOCK_LIGHTING } from '@/lib/constants/stock-project';
import { migrateStudioProject } from '@/lib/studio/project-migration';
import {
  getCoverageShot,
  getSetupBackdrop,
  patchCurrentResolvedShot,
  resolveAllSetupCards,
  resolveShot,
  setupActiveView,
  type ResolvedShot,
} from '@/lib/studio/resolved-shot';
import { migrateAllSetups, type SetupProjectDefaults } from '@/lib/studio/coverage-shot-settings';
import { DEFAULT_SHOT_DEFAULTS } from '@/lib/studio/shot-settings';
import type { CoverageShot, Scene, Setup, Shot, StudioProject } from '@/lib/types/studio';

export interface HierarchySelection {
  scenes: Scene[];
  currentSceneId: number;
  setups: Setup[];
  currentSetupId: number;
  currentCoverageShotId: number;
}

export function projectDefaultsFromStudioData(data: StudioProject): SetupProjectDefaults {
  return {
    lighting: data.lighting ?? STOCK_LIGHTING,
    sceneSetup: data.prompt ?? DEFAULT_SHOT_DEFAULTS.sceneSetup,
  };
}

export function applyProjectHierarchy(
  data: StudioProject,
  setupDefaults: SetupProjectDefaults,
): HierarchySelection & ReturnType<typeof setupActiveView> {
  const migrated = migrateStudioProject(data, {
    ...DEFAULT_SHOT_DEFAULTS,
    ...setupDefaults,
  });

  const scenes = migrated.scenes?.length ? migrated.scenes : [{ id: 1, name: 'Scene 1' }];
  const setups = migrateAllSetups(migrated.setups ?? [], setupDefaults);
  const currentSceneId = migrated.currentSceneId ?? scenes[0]?.id ?? 1;
  const currentSetupId = migrated.currentSetupId ?? setups[0]?.id ?? 1;
  const activeSetup = setups.find((s) => s.id === currentSetupId) ?? setups[0];
  const currentCoverageShotId =
    migrated.currentCoverageShotId ??
    activeSetup?.shots.find((s) => s.active)?.id ??
    activeSetup?.shots[0]?.id ??
    1;
  const coverage = getCoverageShot(activeSetup, currentCoverageShotId);
  const view = activeSetup && coverage ? setupActiveView(activeSetup, coverage) : {
    camera: DEFAULT_SHOT_DEFAULTS.camera,
    lighting: setupDefaults.lighting,
    motion: DEFAULT_SHOT_DEFAULTS.motion,
    sceneSetup: setupDefaults.sceneSetup,
    shotActivity: '',
  };

  return {
    scenes,
    currentSceneId,
    setups,
    currentSetupId: activeSetup?.id ?? currentSetupId,
    currentCoverageShotId: coverage?.id ?? currentCoverageShotId,
    ...view,
  };
}

export function getCurrentSetupFromList(
  setups: Setup[],
  setupId: number,
): Setup | undefined {
  return setups.find((s) => s.id === setupId) ?? setups[0];
}

export function getCurrentCoverageFromSetup(
  setup: Setup | undefined,
  coverageShotId: number,
): CoverageShot | undefined {
  return getCoverageShot(setup, coverageShotId);
}

export function getResolvedCurrentShot(
  setups: Setup[],
  setupId: number,
  coverageShotId: number,
): ResolvedShot | undefined {
  const setup = getCurrentSetupFromList(setups, setupId);
  const coverage = getCurrentCoverageFromSetup(setup, coverageShotId);
  const backdrop = setup ? getSetupBackdrop(setup, coverage?.backdropId) : undefined;
  return resolveShot(setup, coverage, backdrop);
}

export function getTimelineShots(setups: Setup[]): ResolvedShot[] {
  return resolveAllSetupCards(setups);
}

export function buildHierarchyPersistence(state: {
  scenes: Scene[];
  currentSceneId: number;
  setups: Setup[];
  currentSetupId: number;
  currentCoverageShotId: number;
}) {
  return {
    scenes: state.scenes,
    currentSceneId: state.currentSceneId,
    setups: state.setups,
    currentSetupId: state.currentSetupId,
    currentCoverageShotId: state.currentCoverageShotId,
  };
}

export function patchResolvedShotInSetups(
  setups: Setup[],
  setupId: number,
  coverageShotId: number,
  patch: Partial<Shot>,
): Setup[] {
  return patchCurrentResolvedShot(setups, setupId, coverageShotId, patch);
}

export function findSetupForCoverageShot(
  setups: Setup[],
  coverageShotId: number,
): Setup | undefined {
  return setups.find((setup) => setup.shots.some((s) => s.id === coverageShotId));
}

export function findSetupIdForCoverageShot(
  setups: Setup[],
  coverageShotId: number,
): number | undefined {
  return findSetupForCoverageShot(setups, coverageShotId)?.id;
}
