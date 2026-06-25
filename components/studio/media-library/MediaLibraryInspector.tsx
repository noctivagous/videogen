'use client';

import { useEffect, useRef, useState } from 'react';
import { ReferenceImageViewerModal } from '@/components/studio/ReferenceImageViewerModal';
import {
  formatMediaAssetOrigin,
  formatMediaAssetSummary,
  truncateId,
} from '@/components/studio/media-library/media-library-labels';
import { WORKFLOW_OPTIONS } from '@/lib/constants/workflows';
import { getMediaAssetTypeLabel, MEDIA_ASSET_TYPE_ORDER } from '@/lib/media/media-library-query';
import { getMediaAsset, resolveAssetDisplayUrl } from '@/lib/media/media-library';
import type { MediaAsset, MediaAssetType, MediaWorkflowOrigin, ShotWorkflowSnapshot } from '@/lib/types/media-library';
import type { Shot } from '@/lib/types/studio';
import { useStudioStore } from '@/store/useStudioStore';

const IMAGE_TYPES = new Set<MediaAssetType>([
  'unclassified', 'character-sheet', 'backdrop-plate', 'backdrop', 'baked-frame', 'intermediate-frame', 'reference',
]);

function mimeFromUrl(url: string): string | null {
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;,]+)/);
    return match?.[1] ?? null;
  }
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  const extMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  };
  return ext ? (extMap[ext] ?? null) : null;
}

function formatMime(mime: string | null): string {
  if (!mime) return '—';
  return mime.replace('image/', '').replace('video/', 'video/').toUpperCase();
}

function useImageDimensions(url: string | null): { width: number; height: number } | null {
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (!url) { setDims(null); return; }
    setDims(null);
    const img = new Image();
    img.onload = () => setDims({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => setDims(null);
    img.src = url;
  }, [url]);
  return dims;
}

interface MediaLibraryInspectorProps {
  selectedId: string | null;
  assets: MediaAsset[];
  snapshots: ShotWorkflowSnapshot[];
  shots: Shot[];
  onSelectAsset: (assetId: string) => void;
  onGoToShot: (shotId: number) => void;
}

const ORIGIN_OPTIONS: { value: MediaWorkflowOrigin; label: string }[] = [
  { value: 'upload', label: 'Upload' },
  { value: 'generated', label: 'Generated' },
  ...WORKFLOW_OPTIONS.map((opt) => ({ value: opt.value as MediaWorkflowOrigin, label: opt.label })),
];

export function MediaLibraryInspector({
  selectedId,
  assets,
  snapshots,
  shots,
  onSelectAsset,
  onGoToShot,
}: MediaLibraryInspectorProps) {
  const updateMediaAsset = useStudioStore((s) => s.updateMediaAsset);
  const deleteMediaAssets = useStudioStore((s) => s.deleteMediaAssets);
  const moveMediaAssetsToScope = useStudioStore((s) => s.moveMediaAssetsToScope);
  const replaceMediaAssetContentFromDataUrl = useStudioStore((s) => s.replaceMediaAssetContentFromDataUrl);
  const replaceMediaAssetUrlValue = useStudioStore((s) => s.replaceMediaAssetUrlValue);
  const indexClipEmbeddings = useStudioStore((s) => s.indexClipEmbeddings);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset =
    selectedId && !selectedId.startsWith('snapshot:')
      ? assets.find((a) => a.id === selectedId) ?? getMediaAsset(assets, selectedId)
      : undefined;

  const imageUrlForDims =
    selectedAsset && IMAGE_TYPES.has(selectedAsset.type)
      ? resolveAssetDisplayUrl(selectedAsset)
      : null;
  const dims = useImageDimensions(imageUrlForDims);

  if (!selectedId) {
    return (
      <div className="media-library-inspector media-library-inspector--empty flex items-center justify-center h-full p-4 text-sm text-gray-500 text-center">
        Select an asset or snapshot to view and edit properties.
      </div>
    );
  }

  if (selectedId.startsWith('snapshot:')) {
    const snapshotId = selectedId.slice('snapshot:'.length);
    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      return (
        <div className="media-library-inspector p-4 text-sm text-gray-500">Snapshot not found.</div>
      );
    }
    return <SnapshotInspector snapshot={snapshot} onSelectAsset={onSelectAsset} onGoToShot={onGoToShot} />;
  }

  const asset = selectedAsset;
  if (!asset) {
    return <div className="media-library-inspector p-4 text-sm text-gray-500">Asset not found.</div>;
  }

  const isDerivedAsset = asset.id.startsWith('derived:');

  const patchMeta = (field: keyof MediaAsset['metadata'], value: string) => {
    if (isDerivedAsset) return;
    if (field === 'usedInShots') return;
    updateMediaAsset(asset.id, {
      metadata: { [field]: value || undefined } as Partial<MediaAsset['metadata']>,
    });
  };

  const scope = asset.scope === 'global' ? 'global' : 'project';
  const displayUrl = urlDraft ?? asset.url;
  const isImage = IMAGE_TYPES.has(asset.type);
  const mime = isImage ? mimeFromUrl(asset.url) : null;

  return (
    <div className="media-library-inspector flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-surface-700 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-gray-200">{formatMediaAssetSummary(asset)}</div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{asset.id}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 capitalize">{scope} library</div>
        </div>
        <button
          type="button"
          disabled={isDerivedAsset}
          onClick={() => {
            if (isDerivedAsset) return;
            deleteMediaAssets([asset.id]);
          }}
          className="shrink-0 px-2 py-1 text-[10px] rounded border border-red-900/50 text-red-300 hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>

      {isDerivedAsset && (
        <div className="px-3 py-2 border-b border-surface-700 text-[10px] text-amber-300 bg-amber-950/20">
          Derived asset: editing and destructive actions are disabled here.
        </div>
      )}

      <div className="p-3 border-b border-surface-700">
        {asset.type === 'video' ? (
          <video
            key={asset.url}
            src={asset.url}
            controls
            playsInline
            loop
            className="w-full aspect-video rounded-lg bg-surface-900"
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="media-library-inspector__preview block w-full rounded-lg overflow-hidden border border-surface-700 hover:border-brand-500/40 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveAssetDisplayUrl(asset)}
                alt=""
                className="w-full aspect-video object-contain bg-surface-900"
              />
            </button>
            <p className="text-[10px] text-gray-500 mt-1.5">Click to open full preview</p>
          </>
        )}
      </div>

      {isImage && (
        <div className="px-3 py-2 border-b border-surface-700 flex items-center gap-4 text-[10px] text-gray-400">
          <span>
            <span className="text-gray-500 uppercase tracking-wider font-semibold mr-1">Format</span>
            {formatMime(mime)}
          </span>
          <span>
            <span className="text-gray-500 uppercase tracking-wider font-semibold mr-1">Size</span>
            {dims ? `${dims.width} × ${dims.height}` : '—'}
          </span>
        </div>
      )}

      <div className="p-3 flex flex-col gap-3">
        <InspectorField label="Type">
          <select
            value={asset.type}
            onChange={(e) =>
              updateMediaAsset(asset.id, { type: e.target.value as MediaAssetType })
            }
            disabled={isDerivedAsset}
            className="media-library-field w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {MEDIA_ASSET_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>
                {getMediaAssetTypeLabel(type)}
              </option>
            ))}
          </select>
        </InspectorField>

        <InspectorField label="Workflow origin">
          <select
            value={asset.workflowOrigin ?? ''}
            onChange={(e) =>
              updateMediaAsset(asset.id, {
                workflowOrigin: (e.target.value || undefined) as MediaWorkflowOrigin | undefined,
              })
            }
            disabled={isDerivedAsset}
            className="media-library-field w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">—</option>
            {ORIGIN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </InspectorField>

        <InspectorField label="Character ID">
          <input
            type="text"
            value={asset.metadata.characterId ?? ''}
            onChange={(e) => patchMeta('characterId', e.target.value)}
            disabled={isDerivedAsset}
            className="media-library-field w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </InspectorField>

        <InspectorField label="Prompt">
          <textarea
            value={asset.metadata.prompt ?? ''}
            onChange={(e) => patchMeta('prompt', e.target.value)}
            rows={3}
            disabled={isDerivedAsset}
            className="media-library-field w-full resize-y min-h-[4rem] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </InspectorField>

        <InspectorField label="Provider">
          <input
            type="text"
            value={asset.metadata.provider ?? ''}
            onChange={(e) => patchMeta('provider', e.target.value)}
            disabled={isDerivedAsset}
            className="media-library-field w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </InspectorField>

        <InspectorReadOnly label="Created">{new Date(asset.createdAt).toLocaleString()}</InspectorReadOnly>
        <InspectorReadOnly label="Origin">{formatMediaAssetOrigin(asset.workflowOrigin)}</InspectorReadOnly>

        <InspectorField label="URL">
          <textarea
            value={displayUrl}
            onChange={(e) => setUrlDraft(e.target.value)}
            rows={3}
            disabled={isDerivedAsset}
            className="media-library-field w-full resize-y min-h-[3rem] font-mono text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex flex-wrap gap-1.5 mt-1">
            <button
              type="button"
              disabled={isDerivedAsset}
              onClick={() => {
                if (isDerivedAsset) return;
                void replaceMediaAssetUrlValue(asset.id, displayUrl);
              }}
              className="px-2 py-1 text-[10px] rounded border border-surface-600 hover:bg-surface-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply URL
            </button>
            <button
              type="button"
              disabled={isDerivedAsset}
              onClick={() => setUrlDraft(null)}
              className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
          <p className="text-[9px] text-gray-600 mt-1">
            Data URLs are re-hashed; external URLs update in place.
          </p>
        </InspectorField>

        <InspectorField label="Replace content">
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            disabled={isDerivedAsset}
            onChange={(e) => {
              if (isDerivedAsset) return;
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                void replaceMediaAssetContentFromDataUrl(asset.id, reader.result as string);
              };
              reader.readAsDataURL(file);
            }}
          />
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            disabled={isDerivedAsset}
            className="px-2 py-1 text-[10px] rounded border border-surface-600 hover:bg-surface-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload replacement…
          </button>
        </InspectorField>

        <InspectorField label="Library scope">
          <div className="flex flex-wrap gap-1.5">
            {scope !== 'global' && (
              <button
                type="button"
                onClick={() => moveMediaAssetsToScope([asset.id], 'global')}
                disabled={isDerivedAsset}
                className="px-2 py-1 text-[10px] rounded border border-surface-600 hover:bg-surface-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move to global
              </button>
            )}
            {scope !== 'project' && (
              <button
                type="button"
                onClick={() => moveMediaAssetsToScope([asset.id], 'project')}
                disabled={isDerivedAsset}
                className="px-2 py-1 text-[10px] rounded border border-surface-600 hover:bg-surface-700 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move to project
              </button>
            )}
          </div>
        </InspectorField>

        <InspectorField label="CLIP search">
          <button
            type="button"
            onClick={() => indexClipEmbeddings([asset.id])}
            disabled={isDerivedAsset}
            className="px-2 py-1 text-[10px] rounded border border-brand-600/40 hover:bg-brand-600/10 text-brand-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Index embedding
          </button>
          {asset.metadata.clipEmbedding && (
            <span className="text-[9px] text-gray-500 mt-1 block">
              Indexed ({asset.metadata.clipEmbedding.length} dims)
            </span>
          )}
        </InspectorField>

        {asset.metadata.parentAssetId && (
          <InspectorField label="Parent asset">
            <button
              type="button"
              onClick={() => onSelectAsset(asset.metadata.parentAssetId!)}
              className="text-brand-400 hover:text-brand-300 text-[11px] font-mono"
            >
              {truncateId(asset.metadata.parentAssetId, 20)}
            </button>
          </InspectorField>
        )}

        <InspectorField label="Used in setups">
          {asset.metadata.usedInShots.length === 0 ? (
            <span className="text-gray-500">—</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {asset.metadata.usedInShots.map((shotId) => {
                const name = shots.find((s) => s.id === shotId)?.name ?? `Setup ${shotId}`;
                return (
                  <button
                    key={shotId}
                    type="button"
                    onClick={() => onGoToShot(shotId)}
                    className="px-2 py-0.5 rounded-md bg-surface-700 hover:bg-brand-600/20 text-[10px] text-gray-300 border border-surface-600"
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </InspectorField>
      </div>

      <ReferenceImageViewerModal
        open={previewOpen}
        imageUrl={asset.url}
        label={formatMediaAssetSummary(asset)}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

function SnapshotInspector({
  snapshot,
  onSelectAsset,
  onGoToShot,
}: {
  snapshot: ShotWorkflowSnapshot;
  onSelectAsset: (assetId: string) => void;
  onGoToShot: (shotId: number) => void;
}) {
  const checklistEntries = Object.entries(snapshot.checklistProgress ?? {});

  return (
    <div className="media-library-inspector flex flex-col h-full overflow-y-auto p-3 gap-3">
      <div>
        <div className="text-xs font-semibold text-gray-200">Workflow Snapshot</div>
        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{snapshot.id}</div>
      </div>

      <InspectorReadOnly label="Shot">
        <button
          type="button"
          onClick={() => onGoToShot(snapshot.shotId)}
          className="text-brand-400 hover:text-brand-300"
        >
          {snapshot.shotName}
        </button>
      </InspectorReadOnly>
      <InspectorReadOnly label="Workflow">{snapshot.workflow}</InspectorReadOnly>
      <InspectorReadOnly label="Created">{new Date(snapshot.createdAt).toLocaleString()}</InspectorReadOnly>

      {checklistEntries.length > 0 && (
        <InspectorField label="Checklist progress">
          <ul className="flex flex-col gap-1">
            {checklistEntries.map(([step, done]) => (
              <li key={step} className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className={done ? 'text-brand-400' : 'text-gray-600'}>{done ? '✓' : '○'}</span>
                {step}
              </li>
            ))}
          </ul>
        </InspectorField>
      )}

      <InspectorField label="Linked assets">
        <div className="flex flex-col gap-1">
          {snapshot.assetIds.bakedFrameId && (
            <AssetLink label="Baked frame" id={snapshot.assetIds.bakedFrameId} onSelect={onSelectAsset} />
          )}
          {snapshot.assetIds.intermediateFrameId && (
            <AssetLink
              label="Intermediate"
              id={snapshot.assetIds.intermediateFrameId}
              onSelect={onSelectAsset}
            />
          )}
          {snapshot.assetIds.backdropId && (
            <AssetLink label="Backdrop" id={snapshot.assetIds.backdropId} onSelect={onSelectAsset} />
          )}
          {snapshot.assetIds.characterSheetIds?.map((id) => (
            <AssetLink key={id} label="Character sheet" id={id} onSelect={onSelectAsset} />
          ))}
          {!snapshot.assetIds.bakedFrameId &&
            !snapshot.assetIds.intermediateFrameId &&
            !snapshot.assetIds.backdropId &&
            !(snapshot.assetIds.characterSheetIds?.length ?? 0) && (
              <span className="text-gray-500 text-[11px]">—</span>
            )}
        </div>
      </InspectorField>
    </div>
  );
}

function AssetLink({
  label,
  id,
  onSelect,
}: {
  label: string;
  id: string;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="text-left text-[11px] text-brand-400 hover:text-brand-300"
    >
      {label}: <span className="font-mono">{truncateId(id, 16)}</span>
    </button>
  );
}

function InspectorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="media-library-inspector-field flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function InspectorReadOnly({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="media-library-inspector-field flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">{label}</span>
      <div className="text-[11px] text-gray-300">{children}</div>
    </div>
  );
}
