interface HierarchyTreeConnectorProps {
  /** Draw vertical spine through the full branch height (when nested children follow). */
  extendsBelow?: boolean;
  /** px from top to the corner — aligns with the fieldset titlebar. */
  cornerOffset?: number;
  /** px horizontal stub from spine to content. */
  stubLength?: number;
  className?: string;
}

const LINE_COLOR = 'rgba(57, 55, 55, 0.45)';

/**
 * L-shaped tree bracket using CSS lines so the vertical spine reliably
 * stretches to the bottom of the branch container.
 */
export function HierarchyTreeConnector({
  extendsBelow = false,
  cornerOffset = 10,
  stubLength = 10,
  className = '',
}: HierarchyTreeConnectorProps) {
  const lineStyle = { backgroundColor: LINE_COLOR };

  return (
    <div className={`hierarchy-tree-connector ${className}`.trim()} aria-hidden>
      <div
        className="hierarchy-tree-connector__vertical"
        style={{
          ...lineStyle,
          top: 0,
          ...(extendsBelow ? { bottom: 0 } : { height: cornerOffset }),
        }}
      />
      <div
        className="hierarchy-tree-connector__horizontal"
        style={{
          ...lineStyle,
          top: cornerOffset,
          width: stubLength,
        }}
      />
    </div>
  );
}
