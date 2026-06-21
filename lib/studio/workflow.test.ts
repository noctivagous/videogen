import { describe, expect, it } from 'vitest';
import { buildGenerationPrompt, buildXAIReferencePrompt } from '@/lib/studio/generation-prompt';
import { filterRefsForImageToVideoOnly } from '@/lib/studio/xai-video-models';
import {
  buildWorkflowGenerationRefs,
  shouldUseBakedStartFrameForVideo,
} from '@/lib/studio/workflow';
import type { Shot } from '@/lib/types/studio';

function baseShot(overrides: Partial<Shot> = {}): Shot {
  return {
    id: 1,
    name: 'Test',
    active: true,
    camera: {
      fieldSize: 'ms',
      subjectCount: '1s',
      coverage: 'clean',
      lensType: 'standard',
      focalLength: 35,
      angle: 'eye-level',
      movement: 'static',
      aperture: 2.8,
      dof: 'medium',
    },
    frameComposition: {
      guide: 'grid-3x3',
      placement: 'cell-1-1',
      headroom: 'normal',
      showOverlay: true,
    },
    mannequins: [],
    references: ['data:image/png;base64,sheet', 'data:image/png;base64,backdrop'],
    referenceRoles: ['Subject', 'Backdrop'],
    workflow: 'bake-start-frame',
    bakedStartFrame: 'data:image/png;base64,baked',
    bakeStatus: 'ready',
    sceneSetup: 'A surfer on a beach at golden hour.',
    shotActivity: 'The surfer shifts weight and looks toward the waves.',
    lighting: {
      colorPalette: {},
      videoLighting: { techniqueIds: ['afternoon-sun'] },
      videoEnvironment: { presetId: 'clear-day' },
    },
    motion: { subjectAction: 'shifts-weight', intensity: 'subtle' },
    ...overrides,
  } as Shot;
}

describe('bake-start-frame video generation', () => {
  it('uses only the baked frame as the video ref at slot 0', () => {
    const shot = baseShot();
    expect(shouldUseBakedStartFrameForVideo(shot)).toBe(true);

    const refs = buildWorkflowGenerationRefs(shot)!;
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({
      role: 'Backdrop',
      url: 'data:image/png;base64,baked',
      slotIndex: 0,
    });
  });

  it('selects baked backdrop for image-to-video-only models', () => {
    const refs = buildWorkflowGenerationRefs(baseShot())!;
    const filtered = filterRefsForImageToVideoOnly(refs);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.url).toBe('data:image/png;base64,baked');
  });

  it('omits auto-place scene, lighting, and camera prompts when baked', () => {
    const shot = baseShot();
    const prompt = buildGenerationPrompt({
      sceneSetup: shot.sceneSetup,
      shotActivity: shot.shotActivity,
      camera: shot.camera,
      lighting: shot.lighting,
      motion: shot.motion,
      shot,
    });

    expect(prompt).toContain('surfer shifts weight');
    expect(prompt).not.toContain('golden hour');
    expect(prompt).not.toContain('afternoon');
    expect(prompt).not.toContain('medium shot');
    expect(prompt).not.toContain('camera angle');
  });

  it('uses bake-start xAI binding without auto-place subject/backdrop split', () => {
    const refs = buildWorkflowGenerationRefs(baseShot())!;
    const xaiRef = buildXAIReferencePrompt(refs, baseShot());

    expect(xaiRef).toContain('<IMAGE_1>');
    expect(xaiRef).toContain('locked start frame');
    expect(xaiRef).toContain('do not reframe');
    expect(xaiRef).not.toContain('environment from');
    expect(xaiRef).not.toContain('subject in the video');
  });
});