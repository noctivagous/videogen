'use client';

import { MODALITY_CONFIG } from '@/lib/studio/provider-modalities';
import type { Modality } from '@/lib/types/studio';

interface ModalityChipsProps {
  purposes?: string[];
  modalities?: Modality[];
  showModalities?: boolean;
  compact?: boolean;
}

export function ModalityChips({
  purposes = [],
  modalities = [],
  showModalities = true,
  compact = false,
}: ModalityChipsProps) {
  if (purposes.length === 0 && (!showModalities || modalities.length === 0)) return null;

  return (
    <div className={`chip-stack ${compact ? 'chip-stack--compact' : ''}`}>
      {purposes.length > 0 && (
        <div className="chip-row">
          {purposes.map((purpose) => (
            <span key={purpose} className="purpose-chip">
              {purpose}
            </span>
          ))}
        </div>
      )}
      {showModalities && modalities.length > 0 && (
        <div className="chip-row">
          {modalities.map((modality) => {
            const config = MODALITY_CONFIG[modality];
            return (
              <span key={modality} className={`modality-chip ${config.chipClass}`}>
                {config.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}