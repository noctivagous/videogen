'use client';

import { AtmosphereEnvironmentPanel } from '@/components/studio/AtmosphereEnvironmentPanel';
import { VideoLightingTechniquesPanel } from '@/components/studio/VideoLightingTechniquesPanel';
import { ColorPalettePanel } from '@/components/studio/ColorPalettePanel';
import { ThemeTransformApplyToggle } from '@/components/studio/ThemeTransformApplyToggle';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { resolveThemeTransformLightingInclusion } from '@/lib/constants/theme-transform-lighting';
import type { ThemeTransformLightingInclusion } from '@/lib/types/studio';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Select } from '@/components/ui/Select';
import { useStudioStore } from '@/store/useStudioStore';

type InclusionKey = keyof ThemeTransformLightingInclusion;

function LightingControlHeader({
  label,
  inclusionKey,
  pressed,
  onToggle,
}: {
  label: string;
  inclusionKey: InclusionKey;
  pressed: boolean;
  onToggle: (key: InclusionKey) => void;
}) {
  return (
    <div className="theme-transform-lighting-header">
      <label className="text-xs text-gray-400">{label}</label>
      <ThemeTransformApplyToggle
        pressed={pressed}
        label={label}
        onToggle={() => onToggle(inclusionKey)}
      />
    </div>
  );
}

export function LightingPanel() {
  const lighting = useStudioStore((s) => s.lighting);
  const setLighting = useStudioStore((s) => s.setLighting);
  const inclusion = resolveThemeTransformLightingInclusion(lighting);

  const toggleInclusion = (key: InclusionKey) => {
    setLighting({
      themeTransformLighting: {
        ...inclusion,
        [key]: !inclusion[key],
      },
    });
  };

  return (
    <div className="p-4" {...uiSectionProps(UI_SECTIONS.studioLightingControls, { id: false })}>
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">Theme Transformer</h3>
      </div>
      <p className="text-[10px] text-gray-500 mb-4">Applied to image references</p>
      <ColorPalettePanel />

      <div className="flex items-center gap-2 mb-4 mt-6">
        <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">Lighting</h3>
        <span className="ml-auto text-[9px] uppercase tracking-wider text-gray-500">TT = image refs</span>
      </div>
      <p className="text-[10px] text-gray-500 mb-4 -mt-2">Opt-in for Theme Transformer prompts only</p>

      <div className="space-y-4">
        <div>
          <LightingControlHeader
            label="Key Light"
            inclusionKey="keyLight"
            pressed={inclusion.keyLight}
            onToggle={toggleInclusion}
          />
          <Select value={lighting.keyLight} onChange={(e) => setLighting({ keyLight: e.target.value })}>
            <option value="soft">Soft</option>
            <option value="hard">Hard</option>
            <option value="rim">Rim Light</option>
            <option value="backlight">Backlight</option>
            <option value="side">Side Light</option>
          </Select>
        </div>

        <RangeSlider
          label="Light Intensity"
          valueLabel={`${lighting.intensity}%`}
          min={0}
          max={100}
          value={lighting.intensity}
          onChange={(e) => setLighting({ intensity: parseInt(e.target.value) })}
        />

        <div>
          <LightingControlHeader
            label="Lighting Style"
            inclusionKey="style"
            pressed={inclusion.style}
            onToggle={toggleInclusion}
          />
          <Select value={lighting.style} onChange={(e) => setLighting({ style: e.target.value })}>
            <option value="natural">Natural</option>
            <option value="cinematic">Cinematic</option>
            <option value="dramatic">Dramatic</option>
            <option value="high-key">High Key</option>
            <option value="low-key">Low Key</option>
            <option value="neon">Neon</option>
            <option value="golden-hour">Golden Hour</option>
            <option value="blue-hour">Blue Hour</option>
          </Select>
        </div>

        <div>
          <LightingControlHeader
            label="Time of Day"
            inclusionKey="timeOfDay"
            pressed={inclusion.timeOfDay}
            onToggle={toggleInclusion}
          />
          <Select value={lighting.timeOfDay} onChange={(e) => setLighting({ timeOfDay: e.target.value })}>
            <option value="dawn">Dawn</option>
            <option value="morning">Morning</option>
            <option value="noon">Noon</option>
            <option value="afternoon">Afternoon</option>
            <option value="sunset">Sunset</option>
            <option value="dusk">Dusk</option>
            <option value="night">Night</option>
          </Select>
        </div>

        <RangeSlider
          label="Color Temperature"
          valueLabel={`${lighting.colorTemp}K`}
          colorTemp
          min={2000}
          max={10000}
          step={100}
          value={lighting.colorTemp}
          onChange={(e) => setLighting({ colorTemp: parseInt(e.target.value) })}
          labelTrailing={(
            <ThemeTransformApplyToggle
              pressed={inclusion.colorTemp}
              label="Color Temperature"
              onToggle={() => toggleInclusion('colorTemp')}
            />
          )}
        />

        <div>
          <LightingControlHeader
            label="Atmosphere"
            inclusionKey="atmosphere"
            pressed={inclusion.atmosphere}
            onToggle={toggleInclusion}
          />
          <Select value={lighting.atmosphere} onChange={(e) => setLighting({ atmosphere: e.target.value })}>
            <option value="clear">Clear</option>
            <option value="foggy">Foggy</option>
            <option value="misty">Misty</option>
            <option value="rainy">Rainy</option>
            <option value="snowy">Snowy</option>
            <option value="dusty">Dusty</option>
            <option value="smoky">Smoky</option>
          </Select>
        </div>
      </div>

      <VideoLightingTechniquesPanel />
      <AtmosphereEnvironmentPanel />
    </div>
  );
}