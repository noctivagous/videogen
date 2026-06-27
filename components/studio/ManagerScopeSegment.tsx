'use client';

export type ManagerScope = 'project' | 'global';

interface ManagerScopeSegmentProps {
  value: ManagerScope;
  onChange: (scope: ManagerScope) => void;
  ariaLabel?: string;
}

export function ManagerScopeSegment({
  value,
  onChange,
  ariaLabel = 'Library scope',
}: ManagerScopeSegmentProps) {
  return (
    <div
      className="frame-view-segment manager-scope-segment flex items-center gap-1 shrink-0"
      role="tablist"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'project'}
        className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === 'project' ? 'active' : ''}`}
        onClick={() => onChange('project')}
      >
        Project
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'global'}
        className={`frame-view-segment-btn text-[10px] px-2.5 py-1 ${value === 'global' ? 'active' : ''}`}
        onClick={() => onChange('global')}
      >
        Global
      </button>
    </div>
  );
}
