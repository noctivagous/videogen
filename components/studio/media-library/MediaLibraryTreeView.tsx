'use client';

import { useMemo, useState } from 'react';
import {
  groupMediaAssetsByShotAndWorkflow,
  groupMediaAssetsByType,
} from '@/lib/media/media-library-query';
import { resolveAssetDisplayUrl } from '@/lib/media/media-library';
import type { MediaAsset, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import type { Shot } from '@/lib/types/studio';
import {
  formatMediaAssetSummary,
  truncateId,
} from '@/components/studio/media-library/media-library-labels';

interface MediaLibraryTreeViewProps {
  assets: MediaAsset[];
  snapshots: ShotWorkflowSnapshot[];
  shots: Shot[];
  selectedId: string | null;
  selectedIds?: Set<string>;
  onSelectAsset: (assetId: string, additive?: boolean) => void;
  onToggleSelect?: (assetId: string, additive: boolean) => void;
  onSelectSnapshot: (snapshotId: string) => void;
}

export function MediaLibraryTreeView({
  assets,
  snapshots,
  shots,
  selectedId,
  onSelectAsset,
  onSelectSnapshot,
}: MediaLibraryTreeViewProps) {
  const { shotGroups, unassigned } = useMemo(
    () => groupMediaAssetsByShotAndWorkflow(assets, shots),
    [assets, shots],
  );
  const typeGroups = useMemo(() => groupMediaAssetsByType(unassigned), [unassigned]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    unassigned: false,
    snapshots: true,
    ...Object.fromEntries(shotGroups.map((g) => [`shot:${g.shotId}`, true])),
  }));

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const empty =
    shotGroups.length === 0 && unassigned.length === 0 && snapshots.length === 0;

  if (empty) {
    return (
      <div className="media-library-empty flex items-center justify-center h-full text-sm text-gray-500 p-6 text-center">
        No assets match your search.
      </div>
    );
  }

  return (
    <div className="media-library-tree-view p-2 overflow-y-auto h-full text-xs">
      {shotGroups.map((shotGroup) => {
        const shotKey = `shot:${shotGroup.shotId}`;
        return (
          <TreeFolder
            key={shotKey}
            label={`${shotGroup.shotName} (${shotGroup.assetCount})`}
            expanded={expanded[shotKey] ?? true}
            onToggle={() => toggle(shotKey)}
          >
            {shotGroup.workflows.map((workflowGroup) => {
              const workflowKey = `${shotKey}:wf:${workflowGroup.workflow}`;
              return (
                <TreeFolder
                  key={workflowKey}
                  label={`${workflowGroup.label} (${workflowGroup.assets.length})`}
                  expanded={expanded[workflowKey] ?? true}
                  onToggle={() => toggle(workflowKey)}
                  nested
                >
                  {workflowGroup.assets.map((asset) => (
                    <TreeLeaf
                      key={asset.id}
                      label={formatMediaAssetSummary(asset)}
                      sublabel={truncateId(asset.id)}
                      thumbUrl={resolveAssetDisplayUrl(asset)}
                      selected={selectedId === asset.id}
                      onSelect={() => onSelectAsset(asset.id)}
                    />
                  ))}
                </TreeFolder>
              );
            })}
            {snapshots
              .filter((snapshot) => snapshot.shotId === shotGroup.shotId)
              .map((snapshot) => (
                <TreeLeaf
                  key={snapshot.id}
                  label={`Snapshot · ${snapshot.workflow}`}
                  sublabel={truncateId(snapshot.id)}
                  selected={selectedId === `snapshot:${snapshot.id}`}
                  onSelect={() => onSelectSnapshot(snapshot.id)}
                />
              ))}
          </TreeFolder>
        );
      })}

      {unassigned.length > 0 && (
        <TreeFolder
          label={`Unclassified (${unassigned.length})`}
          expanded={expanded.unassigned ?? false}
          onToggle={() => toggle('unassigned')}
        >
          {typeGroups.map((group) => (
            <TreeFolder
              key={group.type}
              label={`${group.label} (${group.assets.length})`}
              expanded={expanded[`unassigned:${group.type}`] ?? false}
              onToggle={() => toggle(`unassigned:${group.type}`)}
              nested
            >
              {group.assets.map((asset) => (
                <TreeLeaf
                  key={asset.id}
                  label={formatMediaAssetSummary(asset)}
                  sublabel={truncateId(asset.id)}
                  thumbUrl={resolveAssetDisplayUrl(asset)}
                  selected={selectedId === asset.id}
                  onSelect={() => onSelectAsset(asset.id)}
                />
              ))}
            </TreeFolder>
          ))}
        </TreeFolder>
      )}

      {snapshots.filter((s) => !shotGroups.some((g) => g.shotId === s.shotId)).length > 0 && (
        <TreeFolder
          label={`Other Snapshots (${snapshots.filter((s) => !shotGroups.some((g) => g.shotId === s.shotId)).length})`}
          expanded={expanded.snapshots ?? true}
          onToggle={() => toggle('snapshots')}
        >
          {snapshots
            .filter((s) => !shotGroups.some((g) => g.shotId === s.shotId))
            .map((snapshot) => (
              <TreeLeaf
                key={snapshot.id}
                label={snapshot.shotName}
                sublabel={snapshot.workflow}
                selected={selectedId === `snapshot:${snapshot.id}`}
                onSelect={() => onSelectSnapshot(snapshot.id)}
              />
            ))}
        </TreeFolder>
      )}
    </div>
  );
}

function TreeFolder({
  label,
  expanded,
  onToggle,
  nested,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  nested?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`media-library-tree-folder ${nested ? 'mb-0.5' : 'mb-1'}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`media-library-tree-folder-btn w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-surface-800 text-left font-semibold ${
          nested ? 'text-gray-400 text-[11px]' : 'text-gray-300'
        }`}
      >
        <span className="text-gray-500 w-3">{expanded ? '▾' : '▸'}</span>
        {label}
      </button>
      {expanded && (
        <div className={`${nested ? 'ml-3' : 'ml-4'} border-l border-surface-700 pl-1`}>{children}</div>
      )}
    </div>
  );
}

function TreeLeaf({
  label,
  sublabel,
  thumbUrl,
  selected,
  onSelect,
}: {
  label: string;
  sublabel: string;
  thumbUrl?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`media-library-tree-leaf w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
        selected ? 'bg-brand-600/15 text-brand-200' : 'hover:bg-surface-800 text-gray-300'
      }`}
    >
      {thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbUrl} alt="" className="w-8 h-6 object-cover rounded bg-surface-900 shrink-0" />
      ) : (
        <span className="w-8 h-6 rounded bg-surface-700 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        <span className="block truncate text-[10px] text-gray-500">{sublabel}</span>
      </span>
    </button>
  );
}
