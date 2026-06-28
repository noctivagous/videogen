'use client';

import { ManagedModal } from '@/components/ui/ModalManager';
import { UI_SECTIONS, uiSectionProps } from '@/lib/constants/ui-sections';
import { findAssetsByType, resolveAssetDisplayUrl } from '@/lib/media/media-library';
import type { MediaAsset } from '@/lib/types/media-library';
import { useStudioStore } from '@/store/useStudioStore';

export interface LoadAssetModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (assetId: string) => void;
}

export function LoadAssetModal({ open, onClose, onSelect }: LoadAssetModalProps) {
  const mediaLibrary = useStudioStore((s) => s.mediaLibrary);
  const assets = findAssetsByType(mediaLibrary, ['baked-frame', 'intermediate-frame'], {
    workflowOrigin: 'bake-start-frame',
  }).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ManagedModal
      open={open}
      onClose={onClose}
      className="glass w-full max-w-lg max-h-[80vh] rounded-lg border border-surface-700 overflow-hidden flex flex-col modal"
      role="dialog"
      aria-modal="true"
      aria-label="Load baked frame from Assets"
      {...uiSectionProps(UI_SECTIONS.studioLoadAssetModal)}
    >
      <div className="px-4 py-3 border-b border-surface-700 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-200">Load from Assets</span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-surface-700 rounded-lg transition-all text-gray-400 hover:text-white shrink-0"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2">
        {assets.length === 0 ? (
          <p className="text-sm text-gray-500 px-2 py-6 text-center">
            No baked frames saved yet. Bake a start frame or use Save to Assets.
          </p>
        ) : (
          assets.map((asset) => (
            <AssetRow key={asset.id} asset={asset} onSelect={() => onSelect(asset.id)} />
          ))
        )}
      </div>
    </ManagedModal>
  );
}

function AssetRow({ asset, onSelect }: { asset: MediaAsset; onSelect: () => void }) {
  const label = asset.type === 'intermediate-frame' ? 'Intermediate bake' : 'Baked frame';
  const usedIn = asset.metadata.usedInShots.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-3 w-full rounded-xl border border-surface-700 bg-surface-800/60 hover:border-brand-500/50 hover:bg-surface-800 p-2 text-left transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveAssetDisplayUrl(asset)}
        alt=""
        className="w-16 h-10 object-cover rounded-md bg-surface-900 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-gray-200">{label}</div>
        <div className="text-[10px] text-gray-500 truncate">
          {new Date(asset.createdAt).toLocaleString()}
          {usedIn > 0 ? ` · used in ${usedIn} setup${usedIn === 1 ? '' : 's'}` : ''}
        </div>
      </div>
    </button>
  );
}
