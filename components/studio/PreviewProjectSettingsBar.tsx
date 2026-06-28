'use client';

import { BackdropFramingLockToggle } from '@/components/studio/BackdropFramingLockToggle';
import { RESOLUTION_PRESETS } from '@/lib/constants/resolutions';
import { PRO_ENCLOSURE } from '@/lib/constants/prosumer-surfaces';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { AspectRatio } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

const previewSelectClass =
  `${PRO_ENCLOSURE.fieldRelief} preview-settings-select select-arrow appearance-none`.trim();

export function PreviewProjectSettingsBar() {
  const project = useStudioStore((s) => s.project);
  const setProject = useStudioStore((s) => s.setProject);

  const presets = RESOLUTION_PRESETS[project.aspectRatio as AspectRatio] || RESOLUTION_PRESETS['16:9'];

  return (
    <div
      className="preview-project-settings-bar flex items-center gap-2 flex-wrap justify-end"
      {...uiSectionProps(UI_SECTIONS.studioPreviewResolutionBadge)}
    >
      <BackdropFramingLockToggle />

      <select
        value={project.aspectRatio}
        onChange={(e) => setProject({ aspectRatio: e.target.value as AspectRatio })}
        className={previewSelectClass}
        aria-label="Aspect ratio"
      >
        <option value="16:9">16:9 Landscape</option>
        <option value="9:16">9:16 Portrait</option>
        <option value="1:1">1:1 Square</option>
        <option value="4:3">4:3 Classic</option>
        <option value="21:9">21:9 Ultra-wide</option>
      </select>

      <select
        value={project.resolution}
        onChange={(e) => setProject({ resolution: e.target.value })}
        className={previewSelectClass}
        aria-label="Resolution"
      >
        {presets.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label} ({p.value})
          </option>
        ))}
      </select>

      <select
        value={project.fps}
        onChange={(e) => setProject({ fps: parseInt(e.target.value) })}
        className={previewSelectClass}
        aria-label="Frames per second"
      >
        <option value={24}>24 FPS</option>
        <option value={30}>30 FPS</option>
        <option value={60}>60 FPS</option>
        <option value={120}>120 FPS</option>
      </select>

      <div
        className={`${PRO_ENCLOSURE.fieldRelief} preview-settings-duration`}
        title="Output clip length for Generate"
      >
        <input
          type="number"
          value={project.duration}
          min={1}
          max={60}
          onChange={(e) => setProject({ duration: parseInt(e.target.value) || 5 })}
          className="preview-settings-duration__input"
          aria-label="Clip duration in seconds"
        />
        <span className="preview-settings-duration__suffix">sec</span>
      </div>
    </div>
  );
}