'use client';

import type { ReactNode } from 'react';
import { HierarchyTreeConnector } from '@/components/studio/HierarchyTreeConnector';

interface ProjectHierarchyTreeProps {
  setup: ReactNode;
  shot: ReactNode;
  workflow: ReactNode;
}

function HierarchyFieldset({
  title,
  nested = false,
  children,
}: {
  title: string;
  nested?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset
      className={`workflow-step-fieldset workflow-step-fieldset--square min-w-0 ${
        nested ? 'workflow-step-fieldset--nested' : ''
      }`.trim()}
    >
      <legend className="workflow-step-fieldset__legend">{title}</legend>
      {children}
    </fieldset>
  );
}

function TreeBranch({
  depth,
  extendsBelow,
  cornerOffset,
  children,
}: {
  depth: 1 | 2;
  extendsBelow: boolean;
  cornerOffset?: number;
  children: ReactNode;
}) {
  return (
    <div
      className={`project-hierarchy-tree__branch project-hierarchy-tree__branch--depth-${depth}`}
    >
      <HierarchyTreeConnector extendsBelow={extendsBelow} cornerOffset={cornerOffset} />
      <div className="project-hierarchy-tree__content">{children}</div>
    </div>
  );
}

export function ProjectHierarchyTree({ setup, shot, workflow }: ProjectHierarchyTreeProps) {
  return (
    <div className="project-hierarchy-tree">
      <div className="project-hierarchy-tree__root">
        <HierarchyFieldset title="Setup">{setup}</HierarchyFieldset>
      </div>
      <TreeBranch depth={1} extendsBelow={false} cornerOffset={14}>
        <HierarchyFieldset title="Shot" nested>
          <div className="project-hierarchy-tree__shot-body">
            {shot}
            {workflow}
          </div>
        </HierarchyFieldset>
      </TreeBranch>
    </div>
  );
}
