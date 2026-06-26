"use client";

import { useCallback, useState } from "react";

import { BwTonalRangePanel } from "@/components/studio/BwTonalRangePanel";
import { ColorPaletteSwatches } from "@/components/studio/ColorPaletteSwatches";
import { ColorModeIconBar } from "@/components/ui/ColorModeSegment";
import { ColorSchemeButtons } from "@/components/ui/ColorSchemeButtons";
import { ColorWheel } from "@/components/ui/ColorWheel";
import { IntegratedColorPicker } from "@/components/ui/IntegratedColorPicker";
import { RangeSlider } from "@/components/ui/RangeSlider";
import {
  FX_MODE_LABELS,
  harmonyAccentHues,
  isColorPaletteActive,
  isColorPaletteBw,
  isColorPaletteFx,
  normalizeColorPalette,
} from "@/lib/constants/color-palette";
import { paletteGroupEntryLabel } from "@/lib/media/color-palette-group";
import type {
  ColorPaletteMode,
  ColorPaletteSettings,
  ColorScheme,
} from "@/lib/types/studio";
import { useNavigateToStudioPanel } from "@/hooks/use-studio-panel-navigation";
import { useStudioStore } from "@/store/useStudioStore";

interface SavedPaletteGroup {
  id: string;
  palette: ColorPaletteSettings;
}

function snapshotPalette(palette: ColorPaletteSettings): ColorPaletteSettings {
  return normalizeColorPalette({
    ...palette,
    bw: { ...palette.bw },
  });
}

type SaveDestinationType = "media-library" | "character" | "location";

export function ColorPaletteMakerPanel() {
  const palette = useStudioStore((s) => s.colorPaletteMakerDraft);
  const setPalette = useStudioStore((s) => s.setColorPaletteMakerDraft);
  const applyPalette = useStudioStore((s) => s.applyColorPaletteMakerDraft);
  const saveColorPaletteGroup = useStudioStore((s) => s.saveColorPaletteGroup);
  const characters = useStudioStore((s) => s.characters);
  const locations = useStudioStore((s) => s.locations);
  const navigateToPanel = useNavigateToStudioPanel();
  const [savedPaletteGroups, setSavedPaletteGroups] = useState<
    SavedPaletteGroup[]
  >([]);
  const [collectionName, setCollectionName] = useState("");
  const [saveDestination, setSaveDestination] =
    useState<SaveDestinationType>("media-library");
  const [saveCharacterId, setSaveCharacterId] = useState("");
  const [saveLocationId, setSaveLocationId] = useState("");

  const addCurrentPaletteGroup = useCallback(() => {
    setSavedPaletteGroups((groups) => [
      ...groups,
      { id: crypto.randomUUID(), palette: snapshotPalette(palette) },
    ]);
  }, [palette]);

  const removePaletteGroup = useCallback((id: string) => {
    setSavedPaletteGroups((groups) =>
      groups.filter((group) => group.id !== id),
    );
  }, []);

  const handleSaveCollection = useCallback(() => {
    if (savedPaletteGroups.length === 0) return;
    const name = collectionName.trim() || "Untitled Palette";
    const groups = savedPaletteGroups.map(({ id, palette: groupPalette }) => ({
      id,
      palette: groupPalette,
    }));

    if (saveDestination === "character") {
      if (!saveCharacterId) return;
      saveColorPaletteGroup(name, groups, {
        type: "character",
        characterId: saveCharacterId,
      });
    } else if (saveDestination === "location") {
      if (!saveLocationId) return;
      saveColorPaletteGroup(name, groups, {
        type: "location",
        locationId: saveLocationId,
      });
    } else {
      saveColorPaletteGroup(name, groups, { type: "media-library" });
    }

    setSavedPaletteGroups([]);
    setCollectionName("");
  }, [
    collectionName,
    saveCharacterId,
    saveColorPaletteGroup,
    saveDestination,
    saveLocationId,
    savedPaletteGroups,
  ]);

  const canSaveCollection =
    savedPaletteGroups.length > 0 &&
    (saveDestination === "media-library" ||
      (saveDestination === "character" && saveCharacterId) ||
      (saveDestination === "location" && saveLocationId));

  const isOff = palette.mode === "off";
  const isFx = isColorPaletteFx(palette);
  const wheelAccents =
    isColorPaletteBw(palette) || palette.mode === "duotone"
      ? []
      : harmonyAccentHues(palette);
  const wheelSaturation = isColorPaletteBw(palette) ? 0 : palette.saturation;
  const showIntegratedPicker =
    palette.mode === "color" || palette.mode === "false-color";

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-surface-900 p-6">
      <div className="max-w-[57.375rem]">
        <div className="flex items-start gap-3">
          <ColorModeIconBar
            value={palette.mode}
            onChange={(mode: ColorPaletteMode) => setPalette({ mode })}
          />

          {!isOff ? (
            <div className="min-w-[53.25rem] flex-1 bg-surface-800 border border-surface-600 rounded-xl p-4 space-y-4">
              {palette.mode === "color" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-gray-400 shrink-0">Harmony</p>
                  <ColorSchemeButtons
                    value={palette.scheme}
                    onChange={(scheme: ColorScheme) =>
                      setPalette({ scheme, accentHue: null })
                    }
                  />
                </div>
              )}

              <div className="rounded-lg border border-surface-600 bg-surface-900/40 px-3 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300 shrink-0">
                    {isFx
                      ? FX_MODE_LABELS[
                          palette.mode as keyof typeof FX_MODE_LABELS
                        ]
                      : "Color Palette"}
                  </h3>
                  <ColorPaletteSwatches
                    palette={palette}
                    onPatch={setPalette}
                  />
                  {isColorPaletteActive(palette) && (
                    <button
                      type="button"
                      onClick={addCurrentPaletteGroup}
                      className="ml-auto shrink-0 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md border border-surface-600 bg-surface-700 hover:bg-surface-600 text-gray-300 transition-colors"
                    >
                      Add to Palette
                    </button>
                  )}
                </div>
              </div>

              {showIntegratedPicker && (
                <IntegratedColorPicker
                  hue={palette.dominantHue}
                  saturation={palette.saturation}
                  brightness={palette.brightness}
                  accentHues={wheelAccents}
                  selectedAccentHue={palette.accentHue}
                  onAccentSelect={(accentHue) => setPalette({ accentHue })}
                  onChange={(next) => {
                    setPalette({
                      ...(next.hue !== undefined
                        ? { dominantHue: next.hue }
                        : {}),
                      ...(next.saturation !== undefined
                        ? { saturation: next.saturation }
                        : {}),
                      ...(next.brightness !== undefined
                        ? { brightness: next.brightness }
                        : {}),
                      ...(next.accentHue === null ? { accentHue: null } : {}),
                    });
                  }}
                />
              )}

              {palette.mode === "accent-splash" && (
                <div className="flex items-center gap-4">
                  <ColorWheel
                    hue={palette.accentHue ?? palette.dominantHue}
                    saturation={wheelSaturation}
                    brightness={palette.brightness}
                    accentHues={wheelAccents}
                    selectedAccentHue={palette.accentHue}
                    onChange={(hue) =>
                      setPalette({ accentHue: hue, dominantHue: hue })
                    }
                    onAccentSelect={(accentHue) => setPalette({ accentHue })}
                  />
                </div>
              )}

              {palette.mode === "duotone" && (
                <>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Primary
                      </p>
                      <ColorWheel
                        hue={palette.dominantHue}
                        saturation={palette.saturation}
                        brightness={palette.brightness}
                        accentHues={[]}
                        selectedAccentHue={null}
                        onChange={(dominantHue) => setPalette({ dominantHue })}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Secondary
                      </p>
                      <ColorWheel
                        hue={palette.secondaryHue}
                        saturation={palette.saturation}
                        brightness={palette.brightness}
                        accentHues={[]}
                        selectedAccentHue={null}
                        onChange={(secondaryHue) =>
                          setPalette({ secondaryHue })
                        }
                      />
                    </div>
                  </div>
                  <RangeSlider
                    label="Duotone Balance"
                    valueLabel={
                      palette.duotoneBalance < 40
                        ? "Primary"
                        : palette.duotoneBalance > 60
                          ? "Secondary"
                          : "Balanced"
                    }
                    min={0}
                    max={100}
                    value={palette.duotoneBalance}
                    onChange={(e) =>
                      setPalette({
                        duotoneBalance: parseInt(e.target.value, 10),
                      })
                    }
                  />
                </>
              )}

              {!isColorPaletteBw(palette) &&
                palette.mode !== "accent-splash" &&
                !showIntegratedPicker && (
                  <RangeSlider
                    label="Saturation"
                    valueLabel={`${palette.saturation}%`}
                    min={0}
                    max={100}
                    value={palette.saturation}
                    onChange={(e) =>
                      setPalette({ saturation: parseInt(e.target.value, 10) })
                    }
                  />
                )}

              {palette.mode === "false-color" && (
                <RangeSlider
                  label="Spectrum Bias"
                  valueLabel={
                    palette.spectrumBias < 35
                      ? "Narrow"
                      : palette.spectrumBias > 65
                        ? "Wide"
                        : "Medium"
                  }
                  min={0}
                  max={100}
                  value={palette.spectrumBias}
                  onChange={(e) =>
                    setPalette({ spectrumBias: parseInt(e.target.value, 10) })
                  }
                />
              )}

              {palette.mode === "accent-splash" && (
                <>
                  <BwTonalRangePanel palette={palette} onPatch={setPalette} />
                  <RangeSlider
                    label="Accent Strength"
                    valueLabel={`${palette.accentStrength}%`}
                    min={0}
                    max={100}
                    value={palette.accentStrength}
                    onChange={(e) =>
                      setPalette({
                        accentStrength: parseInt(e.target.value, 10),
                      })
                    }
                  />
                </>
              )}

              {!isColorPaletteBw(palette) &&
                palette.mode !== "accent-splash" &&
                !showIntegratedPicker && (
                  <RangeSlider
                    label="Brightness"
                    valueLabel={`${palette.brightness}%`}
                    min={0}
                    max={100}
                    value={palette.brightness}
                    onChange={(e) =>
                      setPalette({ brightness: parseInt(e.target.value, 10) })
                    }
                  />
                )}

              {isColorPaletteBw(palette) && (
                <BwTonalRangePanel palette={palette} onPatch={setPalette} />
              )}

              {savedPaletteGroups.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-surface-600">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">
                    Palette Groups
                  </p>
                  <ul className="space-y-2">
                    {savedPaletteGroups.map((group, index) => (
                      <li
                        key={group.id}
                        className="flex items-center gap-2 flex-wrap rounded-lg border border-surface-600/80 bg-surface-900/40 px-2 py-1.5"
                      >
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider shrink-0">
                          {index + 1}. {paletteGroupEntryLabel(group.palette)}
                        </span>
                        <ColorPaletteSwatches
                          palette={group.palette}
                          interactive={false}
                        />
                        <button
                          type="button"
                          onClick={() => removePaletteGroup(group.id)}
                          className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-gray-500 hover:text-red-400 transition-colors"
                          aria-label={`Remove palette group ${index + 1}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2 pt-2 border-t border-surface-600/60">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      Save Collection
                    </p>
                    <input
                      type="text"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder="Collection name"
                      className="w-full bg-surface-900 border border-surface-600 rounded-lg px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={saveDestination}
                        onChange={(e) =>
                          setSaveDestination(
                            e.target.value as SaveDestinationType,
                          )
                        }
                        className="bg-surface-900 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-brand-500"
                      >
                        <option value="media-library">Media Library</option>
                        <option
                          value="character"
                          disabled={characters.length === 0}
                        >
                          Character
                        </option>
                        <option
                          value="location"
                          disabled={locations.length === 0}
                        >
                          Location
                        </option>
                      </select>
                      {saveDestination === "character" && (
                        <select
                          value={saveCharacterId}
                          onChange={(e) => setSaveCharacterId(e.target.value)}
                          className="min-w-[10rem] flex-1 bg-surface-900 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-brand-500"
                        >
                          <option value="">Select character…</option>
                          {characters.map((character) => (
                            <option key={character.id} value={character.id}>
                              {character.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {saveDestination === "location" && (
                        <select
                          value={saveLocationId}
                          onChange={(e) => setSaveLocationId(e.target.value)}
                          className="min-w-[10rem] flex-1 bg-surface-900 border border-surface-600 rounded-lg px-2 py-1.5 text-xs text-gray-100 focus:outline-none focus:border-brand-500"
                        >
                          <option value="">Select location…</option>
                          {locations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveCollection}
                        disabled={!canSaveCollection}
                        className="ml-auto shrink-0 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md border border-brand-500/50 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      >
                        Save Collection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPalette()}
            disabled={isOff}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-brand-500/50 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            Apply to Lighting
          </button>
          <button
            type="button"
            onClick={() => navigateToPanel("shot-designer")}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 text-gray-300 transition-colors"
          >
            Back to Shot Designer
          </button>
        </div>
      </div>
    </div>
  );
}
