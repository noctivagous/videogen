'use client';

import { PlacementGrid } from '@/components/studio/PlacementGrid';
import {
  formatLensLabel,
  RETAIL_FOCAL_LENGTHS,
  retailFocalLengthIndex,
} from '@/lib/constants/lens';
import { LENS_OPTIONS } from '@/lib/constants/lens-options';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import {
  getCameraCompositionLabel,
  getShotFrameComposition,
  showHeadroomControl,
  showPlacementGrid,
} from '@/lib/studio/composition';
import { FIELD_SIZE_OPTIONS } from '@/lib/constants/field-size-options';
import { ANGLE_OPTIONS } from '@/lib/constants/angle-options';
import { MOVEMENT_OPTIONS } from '@/lib/constants/movement-options';
import { COVERAGE_OPTIONS } from '@/lib/constants/coverage-options';
import { SUBJECT_COUNT_OPTIONS } from '@/lib/constants/subject-count-options';
import { ApertureDiagram } from '@/components/ui/ApertureDiagram';
import { APERTURE_STOPS, apertureStopIndex, formatApertureLabel } from '@/lib/constants/aperture';
import { DOF_OPTIONS } from '@/lib/constants/dof-options';
import { PromptIncludeToggle } from '@/components/studio/PromptIncludeToggle';
import { MannequinPlacementControls } from '@/components/studio/MannequinPlacementControls';
import { WorkflowSection } from '@/components/studio/WorkflowSection';
import { resolveCameraPromptInclusion } from '@/lib/constants/camera-prompt-inclusion';
import { isBakeStartFrame } from '@/lib/studio/workflow';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Select } from '@/components/ui/Select';
import { VisualDropdown } from '@/components/ui/VisualDropdown';
import { useStudioStore } from '@/store/useStudioStore';

const CAMERA_PANEL_LABEL = 'camera-panel-label';

export function CameraPanel() {
  const camera = useStudioStore((s) => s.camera);
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const setCamera = useStudioStore((s) => s.setCamera);
  const setShotFrameComposition = useStudioStore((s) => s.setShotFrameComposition);
  const toggleCompositionOverlay = useStudioStore((s) => s.toggleCompositionOverlay);
  const handleCameraCompositionChange = useStudioStore((s) => s.handleCameraCompositionChange);
  const setMotion = useStudioStore((s) => s.setMotion);
  const setWorkflow = useStudioStore((s) => s.setWorkflow);
  const motion = useStudioStore((s) => s.motion);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const frame = getShotFrameComposition(shot);
  const compositionLabel = getCameraCompositionLabel(camera, frame);
  const inclusion = resolveCameraPromptInclusion(camera);
  const showCoverage = camera.subjectCount === '1s';
  const placementVisible = showPlacementGrid(frame.guide);
  const headroomVisible = showHeadroomControl(camera.fieldSize);
  const blockingInWorkflowRefs = isBakeStartFrame(shot);

  const togglePromptInclusion = (patch: Partial<typeof inclusion>) => {
    setCamera({
      promptInclusion: {
        ...inclusion,
        ...patch,
      },
    });
  };

  return (
    <div className="p-4" {...uiSectionProps(UI_SECTIONS.studioCameraControls, { id: false })}>
      <WorkflowSection shot={shot} onChange={setWorkflow} />

      <div className="border-t border-surface-700 mb-4" aria-hidden />

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 text-brand-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="camera-panel-heading font-semibold text-sm uppercase tracking-wider">Camera</h3>
        </div>
        <PromptIncludeToggle
          pressed={inclusion.includeInPrompt}
          onToggle={() => togglePromptInclusion({ includeInPrompt: !inclusion.includeInPrompt })}
        />
      </div>
      <p className="text-[10px] text-gray-500 mb-4 -mt-2">
        Toggles only affect the text prompt. Controls always apply to preview and start-frame bake.
      </p>

      <div className="border-t border-surface-700 mb-4" aria-hidden />

      <div className="space-y-4">
        <div
          className="space-y-4"
          {...uiSectionProps(UI_SECTIONS.studioCameraShotSetup, { id: false })}
        >
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
              <span className="camera-panel-subheading text-xs font-semibold uppercase tracking-wider">Shot Setup</span>
            </div>
            <PromptIncludeToggle
              pressed={inclusion.shotSetup}
              onToggle={() => togglePromptInclusion({ shotSetup: !inclusion.shotSetup })}
            />
          </div>

        {!blockingInWorkflowRefs && (
          <>
        <VisualDropdown
          label="Field Size"
          labelClassName={CAMERA_PANEL_LABEL}
          value={camera.fieldSize}
          onChange={(fieldSize) => setCamera({ fieldSize })}
          options={FIELD_SIZE_OPTIONS}
          triggerVariant="thumbnailRight"
          menuVariant="grid"
          size="md"
          menuColumns={2}
          cellWidth={96}
          cellHeight={88}
          uiSection={uiSectionProps(UI_SECTIONS.studioCameraFieldSize)}
        />

        <div className="camera-param-chain">
          <VisualDropdown
            label="Subject Count"
            labelClassName={CAMERA_PANEL_LABEL}
            value={camera.subjectCount}
            onChange={(subjectCount) => handleCameraCompositionChange('subjectCount', { subjectCount })}
            options={SUBJECT_COUNT_OPTIONS}
            triggerVariant="thumbnailRight"
            menuVariant="grid"
            size="md"
            menuColumns={2}
            cellWidth={96}
            cellHeight={88}
            uiSection={uiSectionProps(UI_SECTIONS.studioCameraSubjectCount)}
          />

          {showCoverage && (
            <>
              <div className="camera-param-chain__connector" aria-hidden>
                <svg
                  className="camera-param-chain__arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>

              <VisualDropdown
                label="Coverage"
                labelClassName={CAMERA_PANEL_LABEL}
                value={camera.coverage}
                onChange={(coverage) => handleCameraCompositionChange('coverage', { coverage })}
                options={COVERAGE_OPTIONS}
                triggerVariant="thumbnailRight"
                menuVariant="grid"
                size="md"
                menuColumns={2}
                cellWidth={96}
                cellHeight={88}
                uiSection={uiSectionProps(UI_SECTIONS.studioCameraCoverage)}
              />
            </>
          )}
        </div>
          </>
        )}

        <p className="text-xs text-brand-400 font-medium px-1 -mt-1">{compositionLabel}</p>
        </div>

        <div className="border-t border-surface-700 pt-3 space-y-4" {...uiSectionProps(UI_SECTIONS.studioCameraFrameComposition, { id: false })}>
          <div className="flex items-center justify-between px-1">
            <span className="camera-panel-subheading text-xs font-semibold uppercase tracking-wider">Frame Composition</span>
            <span className="text-[10px] font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded px-1.5 py-0.5">
              {shot?.name || 'Shot'}
            </span>
          </div>

          <Select
            label="Composition Guide"
            labelClassName={CAMERA_PANEL_LABEL}
            value={frame.guide}
            onChange={(e) => {
              const guide = e.target.value as typeof frame.guide;
              setShotFrameComposition(
                guide === 'center' ? { guide, placement: 'center' } : { guide },
              );
            }}
          >
            <option value="none">None</option>
            <option value="grid-3x3">3x3 Positions</option>
            <option value="center">Center / Symmetry</option>
            <option value="fill-frame">Fill Frame</option>
          </Select>

          {placementVisible && (
            <div className="parameter-enclosure">
              <label className={`text-xs text-gray-400 mb-1 block ${CAMERA_PANEL_LABEL}`}>Subject Placement</label>
              <p className="text-[10px] text-gray-500 mb-2 leading-snug">
                Tap a cell or dot below, or click/drag on the framing preview to reposition the subject.
              </p>
              <PlacementGrid
                value={frame.placement}
                onChange={(placement) => setShotFrameComposition({ placement })}
              />
            </div>
          )}

          {headroomVisible && (
            <Select
              label="Headroom"
              labelClassName={CAMERA_PANEL_LABEL}
              value={frame.headroom}
              onChange={(e) => setShotFrameComposition({ headroom: e.target.value as typeof frame.headroom })}
            >
              <option value="tight">Tight</option>
              <option value="normal">Normal</option>
              <option value="generous">Generous</option>
            </Select>
          )}

          <div className="parameter-enclosure flex items-center justify-between">
            <label className={`text-xs text-gray-400 ${CAMERA_PANEL_LABEL}`}>Show Guides</label>
            <button
              type="button"
              className={`composition-toggle ${frame.showOverlay ? 'active' : ''}`}
              aria-pressed={frame.showOverlay}
              onClick={toggleCompositionOverlay}
            >
              <span className="composition-toggle-knob" />
            </button>
          </div>
        </div>

        <VisualDropdown
          label="Lens"
          labelClassName={CAMERA_PANEL_LABEL}
          value={camera.lensType}
          onChange={(lensType) => setCamera({ lensType })}
          options={LENS_OPTIONS}
          triggerVariant="thumbnailRight"
          menuVariant="grid"
          size="md"
          menuColumns={2}
          cellWidth={96}
          cellHeight={88}
          uiSection={uiSectionProps(UI_SECTIONS.studioCameraLens)}
        />

        <RangeSlider
          label="Focal Length"
          labelClassName={CAMERA_PANEL_LABEL}
          valueLabel={formatLensLabel(camera)}
          min={0}
          max={RETAIL_FOCAL_LENGTHS.length - 1}
          step={1}
          value={retailFocalLengthIndex(camera.focalLength)}
          onChange={(e) =>
            setCamera({ focalLength: RETAIL_FOCAL_LENGTHS[parseInt(e.target.value, 10)] })
          }
        />
        <p className="text-[10px] text-gray-500 -mt-2">
          Snaps to retail focal lengths (8–200mm). Crossing a lens zone updates the Lens dropdown automatically.
        </p>

        <VisualDropdown
          label="Angle"
          labelClassName={CAMERA_PANEL_LABEL}
          value={camera.angle}
          onChange={(angle) => setCamera({ angle })}
          options={ANGLE_OPTIONS}
          triggerVariant="thumbnailRight"
          menuVariant="grid"
          size="md"
          menuColumns={2}
          cellWidth={96}
          cellHeight={88}
          uiSection={uiSectionProps(UI_SECTIONS.studioCameraAngle)}
        />

        <VisualDropdown
          label="Movement"
          labelClassName={CAMERA_PANEL_LABEL}
          value={camera.movement}
          onChange={(movement) => setCamera({ movement })}
          options={MOVEMENT_OPTIONS}
          triggerVariant="thumbnailRight"
          menuVariant="grid"
          size="md"
          menuColumns={2}
          cellWidth={96}
          cellHeight={88}
          uiSection={uiSectionProps(UI_SECTIONS.studioCameraMovement)}
        />

        <RangeSlider
          label="Aperture"
          labelClassName={CAMERA_PANEL_LABEL}
          valueLabel={formatApertureLabel(camera.aperture)}
          min={0}
          max={APERTURE_STOPS.length - 1}
          step={1}
          value={apertureStopIndex(camera.aperture)}
          onChange={(e) =>
            setCamera({ aperture: APERTURE_STOPS[parseInt(e.target.value, 10)] })
          }
          leading={<ApertureDiagram fNumber={camera.aperture} size={52} />}
        />
        <p className="text-[10px] text-gray-500 -mt-2">
          Snaps to full f-stops (f/1.4–f/22). Aperture and Depth of Field stay in sync.
        </p>

        <VisualDropdown
          label="Depth of Field"
          labelClassName={CAMERA_PANEL_LABEL}
          value={camera.dof}
          onChange={(dof) => setCamera({ dof })}
          options={DOF_OPTIONS}
          triggerVariant="thumbnailRight"
          menuVariant="grid"
          size="md"
          menuColumns={2}
          cellWidth={96}
          cellHeight={88}
          uiSection={uiSectionProps(UI_SECTIONS.studioCameraDepthOfField)}
        />

        <div className="pt-4 border-t border-surface-700" {...uiSectionProps(UI_SECTIONS.studioCameraMotionSubject, { id: false })}>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="camera-panel-subheading font-semibold text-xs uppercase tracking-wider">Motion & Subject</h3>
          </div>

          <div className="space-y-4">
            <Select
              label="Motion Intensity"
              labelClassName={CAMERA_PANEL_LABEL}
              value={motion.intensity}
              onChange={(e) => setMotion({ intensity: e.target.value })}
            >
              <option value="none">None</option>
              <option value="subtle">Subtle</option>
              <option value="moderate">Moderate</option>
              <option value="dynamic">Dynamic</option>
              <option value="intense">Intense</option>
            </Select>

            <Select
              label="Subject Action"
              labelClassName={CAMERA_PANEL_LABEL}
              value={motion.subjectAction}
              onChange={(e) => setMotion({ subjectAction: e.target.value })}
            >
              <option value="none">None</option>
              <option value="still">Still Pose</option>
              <option value="walking">Walking</option>
              <option value="running">Running</option>
              <option value="talking">Talking</option>
              <option value="gesturing">Gesturing</option>
              <option value="dancing">Dancing</option>
              <option value="custom">Custom</option>
            </Select>

            <RangeSlider
              label="Stabilization"
              labelClassName={CAMERA_PANEL_LABEL}
              valueLabel={`${motion.stabilization}%`}
              min={0}
              max={100}
              value={motion.stabilization}
              onChange={(e) => setMotion({ stabilization: parseInt(e.target.value) })}
            />

            <Select
              label="Motion Blur"
              labelClassName={CAMERA_PANEL_LABEL}
              value={motion.motionBlur}
              onChange={(e) => setMotion({ motionBlur: e.target.value })}
            >
              <option value="off">Off</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}