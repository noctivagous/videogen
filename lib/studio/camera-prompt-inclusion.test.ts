import { describe, expect, it } from 'vitest';
import { STOCK_CAMERA } from '@/lib/constants/stock-project';
import { DEFAULT_FRAME_COMPOSITION } from '@/lib/constants/camera';
import { getGenerationCameraPrompt } from '@/lib/studio/generation-prompt';
import { buildPromptTable } from '@/lib/studio/prompt-table';
import { STOCK_LIGHTING, STOCK_MOTION } from '@/lib/constants/stock-project';

describe('camera prompt inclusion', () => {
  const frame = DEFAULT_FRAME_COMPOSITION;

  it('excludes all camera parts when master toggle is off', () => {
    const camera = {
      ...STOCK_CAMERA,
      promptInclusion: { includeInPrompt: false, shotSetup: true },
    };
    expect(getGenerationCameraPrompt(camera, frame)).toBe('');

    const rows = buildPromptTable({
      sceneSetup: '',
      shotActivity: '',
      camera,
      lighting: STOCK_LIGHTING,
      motion: { ...STOCK_MOTION, subjectAction: 'walking' },
      shot: undefined,
      providerId: 'xai',
      refs: [],
      cinematographyRefs: false,
    });
    expect(rows.some((r) => r.source.startsWith('Camera'))).toBe(false);
    expect(rows.some((r) => r.source.startsWith('Motion'))).toBe(false);
  });

  it('excludes shot setup but keeps lens and angle when shot setup toggle is off', () => {
    const camera = {
      ...STOCK_CAMERA,
      promptInclusion: { includeInPrompt: true, shotSetup: false },
    };
    const prompt = getGenerationCameraPrompt(camera, frame);
    expect(prompt).not.toContain('single subject');
    expect(prompt).toContain('50mm');
    expect(prompt).toContain('camera angle');
  });

  it('includes shot setup when both toggles are on', () => {
    const camera = {
      ...STOCK_CAMERA,
      promptInclusion: { includeInPrompt: true, shotSetup: true },
    };
    const prompt = getGenerationCameraPrompt(camera, frame);
    expect(prompt).toContain('single subject');
    expect(prompt).toContain('50mm');
  });
});