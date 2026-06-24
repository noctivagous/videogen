export type TypedOrManualSourceMode = 'typed' | 'manual';
export type ResolvedTypedOrManualSourceMode = TypedOrManualSourceMode | 'none';

export interface TypedOrManualAvailability {
  hasTypedValue: boolean;
  hasManualValue: boolean;
}

/**
 * Resolve which source mode is actively in effect for a slot.
 * Explicit mode is honored when both sources are available; otherwise
 * we fall back to whichever source has data.
 */
export function resolveTypedOrManualSourceMode(
  explicitMode: TypedOrManualSourceMode | null | undefined,
  availability: TypedOrManualAvailability,
): ResolvedTypedOrManualSourceMode {
  if (explicitMode === 'typed') return 'typed';
  if (explicitMode === 'manual') return 'manual';

  const { hasTypedValue, hasManualValue } = availability;
  if (!hasTypedValue && !hasManualValue) return 'none';
  if (!hasTypedValue) return 'manual';
  if (!hasManualValue) return 'typed';
  return 'typed';
}
