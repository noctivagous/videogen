'use client';

import { useState, useEffect, type ComponentType } from 'react';
import {
  mannequinsToInstances,
  instancePatchToMannequinPatch,
  type PoseBlockInstance,
} from '@/lib/poseblock/adapter';
import { mannequinFeetBottomPct } from '@/lib/studio/mannequin-layout';
import {
  isPrincipalMannequin,
  isValidSubjectSlotAssignment,
} from '@/lib/studio/mannequin-character-assignment';
import { useCharacterAssignmentConnectorContext } from '@/components/studio/ThemeTransformConnectorProvider';
import type { AspectRatio, Mannequin, Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

// ---------------------------------------------------------------------------
// Runtime import via non-literal string — Turbopack does not statically follow
// variable-based import() calls, so PoseBlock's @/ aliases never resolve
// against VideoGen's tsconfig and the build stays clean.
// ---------------------------------------------------------------------------

const POSEBLOCK_PKG = 'poseblock';

// PoseBlockCompositor props shape — mirrors PoseBlock/types.ts without importing it.
interface CompositorProps {
  className?: string;
  backdropUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  instances?: PoseBlockInstance[];
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onInstanceChange?: (id: string, patch: Partial<PoseBlockInstance>) => void;
  enableExport?: boolean;
}

// ---------------------------------------------------------------------------
// Aspect ratio → frame dimensions
// ---------------------------------------------------------------------------

function frameDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
  const map: Record<AspectRatio, { width: number; height: number }> = {
    '16:9': { width: 1600, height: 900 },
    '9:16': { width: 900, height: 1600 },
    '1:1': { width: 1000, height: 1000 },
    '4:3': { width: 1200, height: 900 },
    '21:9': { width: 2100, height: 900 },
  };
  return map[aspectRatio] ?? map['16:9'];
}

// ---------------------------------------------------------------------------
// Character-assignment connector anchor overlay
// Renders invisible DOM anchors at each principal mannequin's approximate
// torso position so connector lines can attach to them.
// ---------------------------------------------------------------------------

interface ConnectorAnchorsProps {
  mannequins: Mannequin[];
  shot: Shot | undefined;
}

function ConnectorAnchors({ mannequins, shot }: ConnectorAnchorsProps) {
  const characterConnector = useCharacterAssignmentConnectorContext();
  if (!characterConnector?.characterAssignmentEnabled) return null;

  const principals = mannequins.filter(isPrincipalMannequin);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {principals.map((m) => {
        const isLinked =
          shot != null &&
          m.subjectSlotIndex != null &&
          isValidSubjectSlotAssignment(shot, m.subjectSlotIndex);
        const ringClass = isLinked
          ? characterConnector.mannequinLinkRingClass(m.subjectSlotIndex)
          : '';
        const feetBottom = mannequinFeetBottomPct(m.y);
        const torsoBottom = Math.min(95, feetBottom + m.scale * 35);

        return (
          <div
            key={m.id}
            ref={(el) => characterConnector.registerMannequinAnchor(m.id, el)}
            className={`mannequin-character-anchor ${ringClass}`}
            style={{
              position: 'absolute',
              left: `${m.x * 100}%`,
              bottom: `${torsoBottom}%`,
              width: '2.5rem',
              height: '3rem',
              transform: 'translateX(-50%)',
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main embed component
// ---------------------------------------------------------------------------

export interface PoseBlockCompositorEmbedProps {
  mannequins: Mannequin[];
  backdropUrl: string | null;
  aspectRatio: AspectRatio;
  selectedIds: string[];
  onSelect: (id: string | null, options?: { shiftKey?: boolean }) => void;
  onInstanceChange: (id: string, patch: Partial<PoseBlockInstance>) => void;
  shot: Shot | undefined;
}

export function PoseBlockCompositorEmbed({
  mannequins,
  backdropUrl,
  aspectRatio,
  selectedIds,
  onSelect,
  onInstanceChange,
  shot,
}: PoseBlockCompositorEmbedProps) {
  const [Compositor, setCompositor] = useState<ComponentType<CompositorProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import(POSEBLOCK_PKG).then((m) => {
      if (!cancelled) {
        setCompositor(() => m.PoseBlockCompositor as ComponentType<CompositorProps>);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { width, height } = frameDimensions(aspectRatio);

  const handleSelect = (ids: string[]) => {
    if (ids.length === 0) {
      onSelect(null);
    } else {
      ids.forEach((id, i) => onSelect(id, { shiftKey: i > 0 }));
    }
  };

  return (
    <div className="absolute inset-0">
      {Compositor ? (
        <Compositor
          className="relative h-full min-h-0 w-full"
          backdropUrl={backdropUrl ?? undefined}
          frameWidth={width}
          frameHeight={height}
          instances={mannequinsToInstances(mannequins)}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onInstanceChange={onInstanceChange}
          enableExport={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-gray-500">Loading 3D compositor…</span>
        </div>
      )}
      <ConnectorAnchors mannequins={mannequins} shot={shot} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Convenience hook — reads everything from the store so PreviewPanel stays clean
// ---------------------------------------------------------------------------

export function usePoseBlockCompositorProps() {
  const shots = useStudioStore((s) => s.shots);
  const currentShot = useStudioStore((s) => s.currentShot);
  const project = useStudioStore((s) => s.project);
  const selectedMannequinIds = useStudioStore((s) => s.selectedMannequinIds);
  const selectMannequin = useStudioStore((s) => s.selectMannequin);
  const clearMannequinSelection = useStudioStore((s) => s.clearMannequinSelection);
  const updateMannequin = useStudioStore((s) => s.updateMannequin);

  const shot = shots.find((s) => s.id === currentShot) || shots[0];
  const aspectRatio = (project.aspectRatio || '16:9') as AspectRatio;

  const onSelect = (id: string | null, options?: { shiftKey?: boolean }) => {
    if (id === null) clearMannequinSelection();
    else selectMannequin(id, options);
  };

  const onInstanceChange = (id: string, patch: Partial<PoseBlockInstance>) => {
    updateMannequin(id, instancePatchToMannequinPatch(patch));
  };

  return { shot, aspectRatio, selectedMannequinIds, onSelect, onInstanceChange };
}
