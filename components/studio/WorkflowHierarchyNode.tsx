'use client';

import { HierarchyLegendGuide } from '@/components/studio/HierarchyLegendGuide';
import { WorkflowDropdown } from '@/components/studio/WorkflowDropdown';
import type { Shot, Workflow } from '@/lib/types/studio';

interface WorkflowHierarchyNodeProps {
  shot: Shot | undefined;
  onChange: (workflow: Workflow) => void;
  description?: string;
  availabilityMessage?: string;
  availabilityAvailable: boolean;
}

export function WorkflowHierarchyNode({
  shot,
  onChange,
  description,
  availabilityMessage,
  availabilityAvailable,
}: WorkflowHierarchyNodeProps) {
  return (
    <fieldset className="workflow-step-fieldset workflow-step-fieldset--square min-w-0 workflow-step-fieldset--hierarchy-depth-2">
      <legend className="workflow-step-fieldset__legend">
        <HierarchyLegendGuide depth={2} />
        <span>Workflow</span>
      </legend>

      <WorkflowDropdown shot={shot} onChange={onChange} label="" />

      {description && (
        <div className="workflow-hierarchy-description mt-1 space-y-1 min-w-0">
          <p className="text-[10px] leading-snug">{description}</p>
          {!availabilityAvailable && availabilityMessage && (
            <p className="text-[10px] text-amber-400/90 leading-snug">{availabilityMessage}</p>
          )}
        </div>
      )}
    </fieldset>
  );
}
