import type { Location, LocationBackdropPlate, Setup } from '@/lib/types/studio';

export const MANUAL_BACKDROP_LOCATION_ID = 'manual-backdrop-plates';
export const MANUAL_BACKDROP_LOCATION_NAME = 'Manual Backdrop Plates';

export function isManualBackdropLocation(location: Pick<Location, 'id' | 'name'>): boolean {
  return location.id === MANUAL_BACKDROP_LOCATION_ID || location.name === MANUAL_BACKDROP_LOCATION_NAME;
}

export function getManualBackdropLocation(locations: Location[]): Location | undefined {
  return locations.find(isManualBackdropLocation);
}

export function getManualBackdropPlates(locations: Location[]): LocationBackdropPlate[] {
  return (getManualBackdropLocation(locations)?.plates ?? []).filter((plate) => Boolean(plate.url));
}

export function getAssignableLocations(locations: Location[]): Location[] {
  return locations.filter((location) => !isManualBackdropLocation(location));
}

export function parseDerivedLocationPlateAssetId(
  assetId: string,
): { locationId: string; plateId: string } | null {
  const match = /^derived:location-plate:([^:]+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { locationId: match[1], plateId: match[2] };
}

export function parseDerivedSetupBackdropAssetId(
  assetId: string,
): { setupId: number; backdropId: string } | null {
  const match = /^derived:backdrop:(\d+):([^:]+)$/.exec(assetId);
  if (!match) return null;
  return { setupId: Number(match[1]), backdropId: match[2] };
}

export function clearPlateFromSetupBackdrops(setups: Setup[], plateId: string): Setup[] {
  return setups.map((setup) => ({
    ...setup,
    backdrops: setup.backdrops.map((backdrop) =>
      backdrop.id === plateId
        ? {
            ...backdrop,
            url: null,
            backdropFramingByAspect: {},
            backdropCropsByAspect: {},
            backdropCropStatusByAspect: {},
          }
        : backdrop,
    ),
  }));
}

export function getSetupIdsUsingPlate(setups: Setup[], plateId: string): number[] {
  return setups
    .filter(
      (setup) =>
        setup.backdrops.some((backdrop) => backdrop.id === plateId && backdrop.url) ||
        setup.shots.some((shot) => shot.backdropId === plateId),
    )
    .map((setup) => setup.id);
}

export function assignLocationToSetups(
  setups: Setup[],
  setupIds: number[],
  locationId: string,
): Setup[] {
  const idSet = new Set(setupIds);
  return setups.map((setup) => (idSet.has(setup.id) ? { ...setup, locationId } : setup));
}

/** After a manual plate moves into a named location, drop setup-level copies and wire setups. */
export function promoteManualPlateToNamedLocation(
  setups: Setup[],
  plateId: string,
  targetLocationId: string,
): Setup[] {
  const affectedSetupIds = getSetupIdsUsingPlate(setups, plateId);
  let next = clearPlateFromSetupBackdrops(setups, plateId);
  if (affectedSetupIds.length > 0) {
    next = assignLocationToSetups(next, affectedSetupIds, targetLocationId);
  }
  return next;
}

export function ensureManualLocationFromSetups(
  locations: Location[],
  setups: Setup[],
): Location[] {
  const existingManual = getManualBackdropLocation(locations);
  const now = Date.now();
  const namedPlateIds = new Set(
    locations
      .filter((location) => !isManualBackdropLocation(location))
      .flatMap((location) => location.plates.map((plate) => plate.id)),
  );
  const existingManualById = new Map((existingManual?.plates ?? []).map((plate) => [plate.id, plate]));
  const byId = new Map<string, LocationBackdropPlate>();

  for (const setup of setups) {
    for (const backdrop of setup.backdrops ?? []) {
      if (!backdrop?.id || !backdrop.url) continue;
      if (namedPlateIds.has(backdrop.id)) continue;
      const prior = byId.get(backdrop.id) ?? existingManualById.get(backdrop.id);
      const setupIds = new Set<number>([...(prior?.setupIds ?? []), setup.id]);
      byId.set(backdrop.id, {
        id: backdrop.id,
        url: backdrop.url,
        label: backdrop.label || prior?.label || `Plate ${backdrop.id}`,
        dataType: 'backdrop-plate',
        source: 'manual',
        setupIds: Array.from(setupIds),
        backdropFramingByAspect: prior?.backdropFramingByAspect ?? {},
        backdropCropsByAspect: prior?.backdropCropsByAspect ?? {},
        backdropCropStatusByAspect: prior?.backdropCropStatusByAspect ?? {},
        createdAt: prior?.createdAt ?? now,
      });
    }
  }

  if (byId.size === 0) {
    return locations.filter((location) => !isManualBackdropLocation(location));
  }

  const manualLocation: Location = {
    id: existingManual?.id ?? MANUAL_BACKDROP_LOCATION_ID,
    name: existingManual?.name ?? MANUAL_BACKDROP_LOCATION_NAME,
    plates: Array.from(byId.values()),
    createdAt: existingManual?.createdAt ?? now,
  };

  return [
    ...locations.filter((location) => !isManualBackdropLocation(location)),
    manualLocation,
  ];
}
