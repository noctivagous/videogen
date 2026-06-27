'use client';

import { create } from 'zustand';

export type EntityImageAssociateKind = 'location' | 'character';

export interface EntityImageAssociateRequest {
  kind: EntityImageAssociateKind;
  imageUrl: string;
  imageLabel?: string;
  /** Required when kind is `character`. */
  slotOrdinal?: number;
}

interface EntityImageAssociateStore {
  request: EntityImageAssociateRequest | null;
  openEntityImageAssociate: (request: EntityImageAssociateRequest) => void;
  closeEntityImageAssociate: () => void;
}

export const useEntityImageAssociateStore = create<EntityImageAssociateStore>((set) => ({
  request: null,
  openEntityImageAssociate: (request) => set({ request }),
  closeEntityImageAssociate: () => set({ request: null }),
}));
