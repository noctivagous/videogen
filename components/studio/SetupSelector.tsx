'use client';

import { Select } from '@/components/ui/Select';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { nextSetupId } from '@/lib/studio/coverage-shot-settings';
import { useStudioStore } from '@/store/useStudioStore';

const NEW_SETUP_DUP = '__new_setup_dup__';
const NEW_SETUP_BLANK = '__new_setup_blank__';

export function SetupSelector() {
  const setups = useStudioStore((s) => s.setups);
  const currentSetupId = useStudioStore((s) => s.currentSetupId);
  const selectSetup = useStudioStore((s) => s.selectSetup);
  const addSetup = useStudioStore((s) => s.addSetup);

  const handleChange = (value: string) => {
    if (value === NEW_SETUP_DUP) {
      const id = nextSetupId(setups);
      addSetup('duplicate');
      selectSetup(id);
      return;
    }
    if (value === NEW_SETUP_BLANK) {
      const id = nextSetupId(setups);
      addSetup('blank');
      selectSetup(id);
      return;
    }
    selectSetup(Number(value));
  };

  if (setups.length === 0) return null;

  return (
    <Select
      label="Setup"
      fieldVariant="relief"
      labelClassName="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1"
      value={String(currentSetupId)}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs py-1.5"
      {...uiSectionProps(UI_SECTIONS.studioPreviewShotLabel)}
    >
      {setups.map((setup) => (
        <option key={setup.id} value={setup.id}>
          {setup.name}
        </option>
      ))}
      <option disabled>──────────</option>
      <option value={NEW_SETUP_DUP}>+ New setup (duplicate current)</option>
      <option value={NEW_SETUP_BLANK}>+ New setup (blank)</option>
    </Select>
  );
}
