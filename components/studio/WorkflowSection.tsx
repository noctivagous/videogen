'use client';

import { ReferenceSlots } from '@/components/studio/ReferenceSlots';
import { CoverageShotSelector } from '@/components/studio/CoverageShotSelector';
import { ProjectHierarchyTree } from '@/components/studio/ProjectHierarchyTree';
import { SetupSelector } from '@/components/studio/SetupSelector';
import { WorkflowHierarchyNode } from '@/components/studio/WorkflowHierarchyNode';
import { useThemeTransformConnectorContext } from '@/components/studio/ThemeTransformConnectorProvider';
import { getWorkflowDefinition } from '@/lib/constants/video-generation-workflows';
import { normalizeWorkflow } from '@/lib/constants/workflows';
import { PRO_ENCLOSURE } from '@/lib/constants/prosumer-surfaces';
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
        workflow={
          <WorkflowHierarchyNode
            shot={shot}
            onChange={onChange}
            description={definition?.description}
            availabilityMessage={availability.message}
            availabilityAvailable={availability.available}
          />
        }
      />

      <div
        className={`camera-panel-workflow-refs ${PRO_ENCLOSURE.reliefBoxDark}`}
        {...uiSectionProps(UI_SECTIONS.studioBottomReferences)}
      >
        <ReferenceSlots slotRefs={slotRefs} hoverSlot={hoverSlot} />
      </div>
    </div>
  );
}
