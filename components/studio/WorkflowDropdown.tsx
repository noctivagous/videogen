'use client';

import { useMemo } from 'react';
import { VisualDropdown } from '@/components/ui/VisualDropdown';
import type { VisualDropdownGroup, VisualDropdownOption } from '@/lib/constants/field-size-options';
import { normalizeWorkflow } from '@/lib/constants/workflows';
import {
  getWorkflowGroups,
  isWorkflowImplemented,
  workflowShortLabel,
} from '@/lib/constants/video-generation-workflows';
import { shotHasWorkflowState } from '@/lib/studio/shot-workflow-state';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import type { Shot, Workflow } from '@/lib/types/studio';

interface WorkflowDropdownProps {
  shot: Shot | undefined;
  onChange: (workflow: Workflow) => void;
}

function buildWorkflowGroups(shot: Shot | undefined): VisualDropdownGroup<Workflow>[] {
  return getWorkflowGroups().map((group) => ({
    label: group.group,
    options: group.items.map(
      (item): VisualDropdownOption<Workflow> => {
        const saved = shot && shotHasWorkflowState(shot, item.id);
        const label = saved ? `${item.label} · saved` : item.label;
        return {
          value: item.id,
          label,
          shortLabel: workflowShortLabel(item.label),
          disabled: !isWorkflowImplemented(item.id),
        };
      },
    ),
  }));
}

function flattenGroups(groups: VisualDropdownGroup<Workflow>[]): VisualDropdownOption<Workflow>[] {
  return groups.flatMap((g) => g.options);
}

export function WorkflowDropdown({ shot, onChange }: WorkflowDropdownProps) {
  const workflow = normalizeWorkflow(shot);
  const groups = useMemo(() => buildWorkflowGroups(shot), [shot]);
  const options = useMemo(() => flattenGroups(groups), [groups]);

  return (
    <VisualDropdown
      value={workflow}
      onChange={onChange}
      options={options}
      groups={groups}
      triggerVariant="thumbnailRight"
      menuVariant="list"
      size="md"
      uiSection={uiSectionProps(UI_SECTIONS.studioShotWorkflow)}
    />
  );
}
