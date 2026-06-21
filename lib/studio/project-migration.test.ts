import { describe, expect, it } from 'vitest';
import { migrateV17ToV18, migrateStudioProject, isLegacyProject } from '@/lib/studio/project-migration';
import { DEFAULT_BACKDROP_ID } from '@/lib/studio/resolved-shot';
import { DEFAULT_SHOT_DEFAULTS } from '@/lib/studio/shot-settings';
import type { Shot, StudioProject } from '@/lib/types/studio';

const DEFAULTS = DEFAULT_SHOT_DEFAULTS;

function makeShot(overrides: Partial<Shot> = {}): Shot {
  return {
    id: 1,
    name: 'Shot 01',
    duration: 5,
    thumbnail: null,
    videoUrl: null,
    active: true,
    sceneSetup: 'An office building lobby',
    lighting: { ...DEFAULTS.lighting },
    references: [null, null],
    referenceRoles: ['Backdrop', 'Subject'],
    camera: { ...DEFAULTS.camera },
    motion: { ...DEFAULTS.motion },
    shotActivity: '',
    workflow: 'bake-start-frame',
    bakeStatus: 'idle',
    mannequins: [],
    ...overrides,
  } as unknown as Shot;
}

function legacyProject(shots: Shot[]): StudioProject {
  return {
    schemaVersion: 17,
    project: { name: 'Test project', colorPalette: 'Vibrant' },
    shots,
    currentShot: shots[0]?.id ?? 1,
    scenes: [],
    setups: [],
    mediaLibrary: [],
    shotWorkflowSnapshots: [],
  } as unknown as StudioProject;
}

describe('isLegacyProject', () => {
  it('returns true for schemaVersion < 18', () => {
    const project = legacyProject([makeShot()]);
    expect(isLegacyProject(project)).toBe(true);
  });

  it('returns false for v18 project with setups', () => {
    const project = {
      schemaVersion: 18,
      setups: [{ id: 1, shots: [] }],
    } as unknown as StudioProject;
    expect(isLegacyProject(project)).toBe(false);
  });
});

describe('migrateV17ToV18', () => {
  it('converts each legacy Shot into one Setup + one CoverageShot', () => {
    const shots = [makeShot({ id: 1, name: 'Shot 01' }), makeShot({ id: 2, name: 'Shot 02', active: false })];
    const result = migrateV17ToV18(legacyProject(shots), DEFAULTS);

    expect(result.schemaVersion).toBe(18);
    expect(result.setups).toHaveLength(2);
    expect(result.scenes).toHaveLength(1);
    expect(result.currentSceneId).toBe(1);

    const setup1 = result.setups[0];
    expect(setup1.id).toBe(1);
    expect(setup1.shots).toHaveLength(1);
    expect(setup1.shots[0].id).toBe(1);
    expect(setup1.backdrops).toHaveLength(1);
    expect(setup1.backdrops[0].id).toBe(DEFAULT_BACKDROP_ID);
  });

  it('preserves setup IDs matching legacy shot IDs', () => {
    const shots = [makeShot({ id: 5 }), makeShot({ id: 9, active: false })];
    const result = migrateV17ToV18(legacyProject(shots), DEFAULTS);
    expect(result.setups.map((s) => s.id)).toEqual([5, 9]);
    expect(result.setups[0].shots[0].id).toBe(5);
    expect(result.setups[1].shots[0].id).toBe(9);
  });

  it('sets currentSetupId and currentCoverageShotId to the legacy currentShot', () => {
    const shots = [makeShot({ id: 3, active: false }), makeShot({ id: 7, active: true })];
    const project = { ...legacyProject(shots), currentShot: 7 };
    const result = migrateV17ToV18(project as unknown as StudioProject, DEFAULTS);
    expect(result.currentSetupId).toBe(7);
    expect(result.currentCoverageShotId).toBe(7);
  });

  it('strips the backdrop reference into SetupBackdrop.url, not Setup.references', () => {
    const shot = makeShot({
      id: 1,
      references: ['data:backdrop', 'data:subject', null],
      referenceRoles: ['Backdrop', 'Subject', 'None'],
    });
    const result = migrateV17ToV18(legacyProject([shot]), DEFAULTS);
    const setup = result.setups[0];

    // backdrop goes into the backdrops plate
    expect(setup.backdrops[0].url).toBe('data:backdrop');

    // Setup.references should NOT include the backdrop slot
    expect(setup.references.every((r) => r !== 'data:backdrop')).toBe(true);
    // Subject reference preserved
    expect(setup.references).toContain('data:subject');
  });

  it('is idempotent — migrating a v18 project returns the same structure', () => {
    const shots = [makeShot()];
    const v18 = migrateV17ToV18(legacyProject(shots), DEFAULTS);
    const again = migrateV17ToV18(v18, DEFAULTS);
    expect(again.setups).toHaveLength(1);
    expect(again.schemaVersion).toBe(18);
  });

  it('handles empty shots array gracefully', () => {
    const result = migrateV17ToV18(legacyProject([]), DEFAULTS);
    expect(result.setups).toHaveLength(0);
    expect(result.scenes).toHaveLength(1);
  });
});

describe('migrateStudioProject', () => {
  it('delegates to migrateV17ToV18', () => {
    const shots = [makeShot()];
    const project = legacyProject(shots);
    const result = migrateStudioProject(project, DEFAULTS);
    expect(result.schemaVersion).toBe(18);
    expect(result.setups).toHaveLength(1);
  });
});
