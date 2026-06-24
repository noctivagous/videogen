import type { Mannequin, Workflow } from '@/lib/types/studio';
import type { WorkflowStepId } from '@/lib/studio/workflow';

export type MediaAssetType =
  | 'character-sheet'
  | 'backdrop-plate'
  | 'backdrop'
  | 'baked-frame'
  | 'intermediate-frame'
  | 'video'
  | 'reference'
  | 'mannequin-layout'
  | 'shot-workflow';

export type MediaWorkflowOrigin = Workflow | 'upload' | 'generated';

export type MediaLibraryScope = 'project' | 'global';

export interface MediaAssetMetadata {
  characterId?: string;
  locationId?: string;
  prompt?: string;
  provider?: string;
  usedInShots: number[];
  parentAssetId?: string;
  /** L2-normalized embedding for CLIP-style similarity search. */
  clipEmbedding?: number[];
}

export interface MediaAsset {
  id: string;
  type: MediaAssetType;
  url: string;
  thumbnailUrl?: string;
  createdAt: number;
  workflowOrigin?: MediaWorkflowOrigin;
  scope?: MediaLibraryScope;
  sortOrder?: number;
  metadata: MediaAssetMetadata;
}

export interface ShotWorkflowSnapshotAssetIds {
  characterSheetIds?: string[];
  backdropId?: string;
  bakedFrameId?: string;
  intermediateFrameId?: string;
}

export interface ShotWorkflowSnapshot {
  id: string;
  workflow: Workflow;
  shotId: number;
  shotName: string;
  createdAt: number;
  checklistProgress: Partial<Record<WorkflowStepId, boolean>>;
  assetIds: ShotWorkflowSnapshotAssetIds;
  mannequins?: Mannequin[];
}

export type ShotLinkedAssetKey = 'characterSheet' | 'backdrop' | 'bakedFrame' | 'intermediate';
