'use client';

import type { ReactNode } from 'react';
import { HierarchyTreeConnector } from '@/components/studio/HierarchyTreeConnector';

interface ProjectHierarchyTreeProps {
  setup: ReactNode;
  shot: ReactNode;
  workflow: ReactNode;
}

function TreeBranch({
  depth,
  extendsBelow,
  children,
}: {
  depth: 1 | 2;
  extendsBelow: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`project-hierarchy-tree__branch project-hierarchy-tree__branch--depth-${depth}`}
    >
      <HierarchyTreeConnector extendsBelow={extendsBelow} />
      <div className="project-hierarchy-tree__content">{children}</div>
    </div>
  );
}

export function ProjectHierarchyTree({ setup, shot, workflow }: ProjectHierarchyTreeProps) {
  return (
    <div className="project-hierarchy-tree">
      <div className="project-hierarchy-tree__root">{setup}</div>
      <TreeBranch depth={1} extendsBelow>
        {shot}
        <TreeBranch depth={2} extendsBelow={false}>{workflow}</TreeBranch>
      </TreeBranch>
    </div>
  );
}
