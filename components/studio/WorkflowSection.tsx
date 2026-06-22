'use client';

import { ReferenceSlots } from '@/components/studio/ReferenceSlots';
import { CoverageShotSelector } from '@/components/studio/CoverageShotSelector';
import { ProjectHierarchyTree } from '@/components/studio/ProjectHierarchyTree';
import { SetupSelector } from '@/components/studio/SetupSelector';
import { WorkflowDropdown } from '@/components/studio/WorkflowDropdown';
import { useThemeTransformConnectorContext } from '@/components/studio/ThemeTransformConnectorProvider';
import { getWorkflowDefinition } from '@/lib/constants/video-generation-workflows';
import { normalizeWorkflow } from '@/lib/constants/workflows';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { getWorkflowModelAvailability } from '@/lib/studio/workflow-capabilities';
import type { Shot, Workflow } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

interface WorkflowSectionProps {
  shot: Shot | undefined;
  onChange: (workflow: Workflow) => void;
}

export function WorkflowSection({ shot, onChange }: WorkflowSectionProps) {
  const ai = useStudioStore((s) => s.ai);
  const { slotRefs, hoverSlot } = useThemeTransformConnectorContext();

  const workflow = normalizeWorkflow(shot);
  const definition = getWorkflowDefinition(workflow);
  const availability = getWorkflowModelAvailability(workflow, ai);

  return (
    <div className="mb-4 space-y-3" {...uiSectionProps(UI_SECTIONS.studioWorkflowSection, { id: false })}>
      <ProjectHierarchyTree
        setup={<SetupSelector />}
        shot={<CoverageShotSelector />}
        workflow={<WorkflowDropdown shot={shot} onChange={onChange} />}
      />

      {definition && (
        <div className="space-y-1 px-0.5">
          <p className="text-[10px] text-[#242424] leading-snug">{definition.description}</p>
          {!availability.available && availability.message && (
            <p className="text-[10px] text-amber-400/90 leading-snug">{availability.message}</p>
          )}
        </div>
      )}

      <div
        className="camera-panel-workflow-refs"
        {...uiSectionProps(UI_SECTIONS.studioBottomReferences)}
      >
        <ReferenceSlots slotRefs={slotRefs} hoverSlot={hoverSlot} />
      </div>
    </div>
  );
}
