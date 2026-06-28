'use client';

import type { ReactNode } from 'react';
import {
  HierarchyLegendGuide,
  type HierarchyLegendDepth,
} from '@/components/studio/HierarchyLegendGuide';

interface ProjectHierarchyTreeProps {
  setup: ReactNode;
  shot: ReactNode;
  workflow: ReactNode;
}

function HierarchyFieldset({
  title,
  depth,
  nested = false,
  children,
}: {
  title: string;
  depth: HierarchyLegendDepth;
  nested?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset
      className={`workflow-step-fieldset workflow-step-fieldset--square min-w-0 workflow-step-fieldset--hierarchy-depth-${depth} ${
        nested ? 'workflow-step-fieldset--nested' : ''
      }`.trim()}
    >
      <legend className="workflow-step-fieldset__legend">
        <HierarchyLegendGuide depth={depth} />
        <span>{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

export function ProjectHierarchyTree({ setup, shot, workflow }: ProjectHierarchyTreeProps) {
  return (
    <div className="project-hierarchy-tree studio-fieldset-hierarchy">
      <HierarchyFieldset title="Setup" depth={0}>
        <div className="project-hierarchy-tree__setup-body">
          {setup}
          <HierarchyFieldset title="Shot" depth={1} nested>
            <div className="project-hierarchy-tree__shot-body">
              {shot}
              {workflow}
            </div>
          </HierarchyFieldset>
        </div>
      </HierarchyFieldset>
    </div>
  );
}
