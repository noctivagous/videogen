'use client';

import { ColorPalettePanel } from '@/components/studio/ColorPalettePanel';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Select } from '@/components/ui/Select';
import { useStudioStore } from '@/store/useStudioStore';

export function LightingPanel() {
  const lighting = useStudioStore((s) => s.lighting);
  const setLighting = useStudioStore((s) => s.setLighting);

  return (
    <div className="p-4" {...uiSectionProps(UI_SECTIONS.studioLightingControls, { id: false })}>
      <ColorPalettePanel />

      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300">Lighting</h3>
      </div>

      <div className="space-y-4">
        <Select label="Key Light" value={lighting.keyLight} onChange={(e) => setLighting({ keyLight: e.target.value })}>
          <option value="soft">Soft</option>
          <option value="hard">Hard</option>
          <option value="rim">Rim Light</option>
          <option value="backlight">Backlight</option>
          <option value="side">Side Light</option>
        </Select>

        <RangeSlider
          label="Light Intensity"
          valueLabel={`${lighting.intensity}%`}
          min={0}
          max={100}
          value={lighting.intensity}
          onChange={(e) => setLighting({ intensity: parseInt(e.target.value) })}
        />

        <Select label="Lighting Style" value={lighting.style} onChange={(e) => setLighting({ style: e.target.value })}>
          <option value="natural">Natural</option>
          <option value="cinematic">Cinematic</option>
          <option value="dramatic">Dramatic</option>
          <option value="high-key">High Key</option>
          <option value="low-key">Low Key</option>
          <option value="neon">Neon</option>
          <option value="golden-hour">Golden Hour</option>
          <option value="blue-hour">Blue Hour</option>
        </Select>

        <Select label="Time of Day" value={lighting.timeOfDay} onChange={(e) => setLighting({ timeOfDay: e.target.value })}>
          <option value="dawn">Dawn</option>
          <option value="morning">Morning</option>
          <option value="noon">Noon</option>
          <option value="afternoon">Afternoon</option>
          <option value="sunset">Sunset</option>
          <option value="dusk">Dusk</option>
          <option value="night">Night</option>
        </Select>

        <RangeSlider
          label="Color Temperature"
          valueLabel={`${lighting.colorTemp}K`}
          colorTemp
          min={2000}
          max={10000}
          step={100}
          value={lighting.colorTemp}
          onChange={(e) => setLighting({ colorTemp: parseInt(e.target.value) })}
        />

        <Select label="Atmosphere" value={lighting.atmosphere} onChange={(e) => setLighting({ atmosphere: e.target.value })}>
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
  );
}