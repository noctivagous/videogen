'use client';

import { WorkflowDropdown } from '@/components/studio/WorkflowDropdown';
import type { Shot, Workflow } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

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
  const projectUi = useStudioStore((s) => s.project.ui);
  const setProject = useStudioStore((s) => s.setProject);
  const descriptionOpen = projectUi?.workflowDescriptionExpanded ?? true;

  const toggleDescription = () => {
    setProject({
      ui: {
        ...projectUi,
        workflowDescriptionExpanded: !descriptionOpen,
      },
    });
  };

  return (
    <fieldset className="workflow-step-fieldset workflow-step-fieldset--square min-w-0">
      <legend className="workflow-step-fieldset__legend">Workflow</legend>

      <WorkflowDropdown shot={shot} onChange={onChange} label="" />

      {description && (
        descriptionOpen ? (
          <fieldset className="workflow-step-fieldset workflow-step-fieldset--square workflow-step-fieldset--nested min-w-0">
            <legend className="workflow-step-fieldset__legend flex items-center gap-1 min-w-0">
              <button
                type="button"
                className="collapsible-prompt-editor__toggle workflow-description__toggle"
                onClick={toggleDescription}
                aria-expanded={descriptionOpen}
                aria-label={descriptionOpen ? 'Collapse description' : 'Expand description'}
              >
                <svg
                  className={`collapsible-prompt-editor__chevron ${
                    descriptionOpen ? 'collapsible-prompt-editor__chevron--open' : ''
                  }`}
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
              Description
            </legend>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] text-[#242424] leading-snug">{description}</p>
              {!availabilityAvailable && availabilityMessage && (
                <p className="text-[10px] text-amber-400/90 leading-snug">{availabilityMessage}</p>
              )}
            </div>
          </fieldset>
        ) : (
          <div className="workflow-description-collapsed min-w-0">
            <button
              type="button"
              className="collapsible-prompt-editor__toggle workflow-description__toggle"
              onClick={toggleDescription}
              aria-expanded={descriptionOpen}
              aria-label="Expand description"
            >
              <svg className="collapsible-prompt-editor__chevron" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
            <span className="workflow-step-fieldset__legend">Description</span>
          </div>
        )
      )}
    </fieldset>
  );
}
