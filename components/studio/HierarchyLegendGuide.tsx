export type HierarchyLegendDepth = 0 | 1 | 2 | 3;

const LINE_PX_PER_DEPTH = 8;
const GUIDE_HEIGHT = 12;
const STROKE = 'currentColor';

interface HierarchyLegendGuideProps {
  depth: HierarchyLegendDepth;
  className?: string;
}

/** Horizontal tree stub rendered before hierarchy titlebar labels. */
export function HierarchyLegendGuide({ depth, className = '' }: HierarchyLegendGuideProps) {
  if (depth === 0) return null;

  const lineLength = depth * LINE_PX_PER_DEPTH;
  const midY = GUIDE_HEIGHT / 2;

  return (
    <svg
      className={`hierarchy-legend-guide ${className}`.trim()}
      width={lineLength}
      height={GUIDE_HEIGHT}
      viewBox={`0 0 ${lineLength} ${GUIDE_HEIGHT}`}
      aria-hidden
    >
      <line
        x1={0}
        y1={midY}
        x2={lineLength}
        y2={midY}
        stroke={STROKE}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
