'use client';

import type { ReactNode } from 'react';

interface ProjectHierarchyTreeProps {
  setup: ReactNode;
  shot: ReactNode;
  workflow: ReactNode;
}

function TreeBranch({ depth, children }: { depth: 1 | 2; children: ReactNode }) {
  return (
    <div
      className={`project-hierarchy-tree__branch project-hierarchy-tree__branch--depth-${depth}`}
    >
      <span className="project-hierarchy-tree__bracket" aria-hidden>
        └
      </span>
      <div className="project-hierarchy-tree__content">{children}</div>
    </div>
  );
}

export function ProjectHierarchyTree({ setup, shot, workflow }: ProjectHierarchyTreeProps) {
  return (
    <div className="project-hierarchy-tree">
      <div className="project-hierarchy-tree__root">{setup}</div>
      <TreeBranch depth={1}>
        {shot}
        <TreeBranch depth={2}>{workflow}</TreeBranch>
      </TreeBranch>
    </div>
  );
}
