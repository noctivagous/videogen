'use client';

import { normalizeWorkflow, WORKFLOW_OPTIONS } from '@/lib/constants/workflows';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { Shot, Workflow } from '@/lib/types/studio';

interface WorkflowDropdownProps {
  shot: Shot | undefined;
  onChange: (workflow: Workflow) => void;
}

export function WorkflowDropdown({ shot, onChange }: WorkflowDropdownProps) {
  const workflow = normalizeWorkflow(shot);

  return (
    <select
      value={workflow}
      onChange={(e) => onChange(e.target.value as Workflow)}
      className="workflow-dropdown w-full text-[11px] font-semibold bg-surface-800 border border-surface-700 rounded-lg px-2 py-1.5 text-gray-200"
      aria-label="Shot workflow"
      {...uiSectionProps(UI_SECTIONS.studioShotWorkflow)}
    >
      {WORKFLOW_OPTIONS.map((option) => (
        <option key={option.value} value={option.value} disabled={!option.enabled}>
          {option.label}
          {!option.enabled ? ' (soon)' : ''}
        </option>
      ))}
    </select>
  );
}