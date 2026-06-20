'use client';

import { useEffect, useMemo, useState, type RefObject } from 'react';
import { centerInContainer } from '@/lib/studio/drag-connector';
import {
  isValidSubjectSlotAssignment,
  SUBJECT_LINK_COLORS,
} from '@/lib/studio/mannequin-character-assignment';
import type { Mannequin, Shot } from '@/lib/types/studio';

export interface CharacterAssignmentLinesProps {
  containerRef: RefObject<HTMLElement | null>;
  slotRefs: RefObject<(HTMLElement | null)[]>;
  mannequinAnchorRefs: RefObject<Record<string, HTMLElement | null>>;
  shot: Shot | undefined;
  mannequins: Mannequin[];
  enabled: boolean;
}

export function CharacterAssignmentLines({
  containerRef,
  slotRefs,
  mannequinAnchorRefs,
  shot,
  mannequins,
  enabled,
}: CharacterAssignmentLinesProps) {
  const [layoutTick, setLayoutTick] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;
    const bump = () => setLayoutTick((n) => n + 1);
    const observer = new ResizeObserver(bump);
    observer.observe(container);
    window.addEventListener('scroll', bump, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', bump, true);
    };
  }, [containerRef, enabled]);

  const segments = useMemo(() => {
    if (!enabled || !shot || !containerRef.current) return [];
    const container = containerRef.current;
    const lines: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      colorClass: string;
    }> = [];

    for (const mannequin of mannequins) {
      const slotIndex = mannequin.subjectSlotIndex;
      if (slotIndex == null || !isValidSubjectSlotAssignment(shot, slotIndex)) continue;
      const slotEl = slotRefs.current[slotIndex];
      const anchorEl = mannequinAnchorRefs.current[mannequin.id];
      if (!slotEl || !anchorEl) continue;
      const from = centerInContainer(slotEl, container);
      const to = centerInContainer(anchorEl, container);
      lines.push({
        key: `${mannequin.id}-${slotIndex}`,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        colorClass: `character-assignment-connector__line--slot-${slotIndex % SUBJECT_LINK_COLORS.length}`,
      });
    }
    return lines;
    // layoutTick forces recompute when container or children resize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, shot, mannequins, containerRef, slotRefs, mannequinAnchorRefs, layoutTick]);

  if (!enabled || segments.length === 0) return null;

  return (
    <svg className="character-assignment-connector character-assignment-connector--persistent" aria-hidden>
      {segments.map((seg) => (
        <line
          key={seg.key}
          className={`character-assignment-connector__line character-assignment-connector__line--persistent ${seg.colorClass}`}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
        />
      ))}
    </svg>
  );
}