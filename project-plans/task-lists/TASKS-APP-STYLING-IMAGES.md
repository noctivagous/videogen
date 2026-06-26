# App styling images — model categories, workflow groups, provider badges

**Status:** Not started

**Goal:** Generate a cohesive image set for Settings / header / App Summary / apps launcher / Color Palette Maker / Shot Workflow dropdown UI — same visual language as cinematography `VisualDropdown` thumbnails (`public/stock/prompts.json`, served under `public/stock/`). Replace placeholder squares in feature-checklist chips, workflow-group picker cards, header `ProviderBadge` strips, text-only apps launcher cards, CSS-gradient stubs in the color-mode toolbar, and text-only shot workflow picker options in the camera panel.

**Style reference:** `public/stock/prompts.json` → `conventions` (charcoal palette, film-school clarity, no text) and existing dropdown assets such as `public/stock/subject-counts/2s.jpg`, `public/stock/shot-types/ms.jpg`.

**Catalog source of truth:** `lib/constants/model-catalog.ts` (`MODEL_CATEGORY_DEFINITIONS`) and `project-plans/MODEL-CATALOG.md`. Workflow groups: `MODEL_UX_GROUPS` in `components/studio/HeaderBar.tsx`. Shot workflows: `video-generation-workflows.json` (loaded via `lib/constants/video-generation-workflows.ts`; rendered in `components/studio/WorkflowDropdown.tsx` → `#studio-shot-workflow`). Studio apps: `STUDIO_LAUNCHER_ITEMS` in `lib/constants/studio-launcher.ts`. Color palette modes: `ColorPaletteMode` + `FX_MODE_LABELS` in `lib/constants/color-palette.ts`.

**UI targets:**

| Surface | Component | Current state |
|---------|-----------|---------------|
| App Summary → feature checklist chips | `AppSummaryPanel` category thumbnail `<span>` | Empty bordered placeholder (`w-6 h-6`) |
| Header → Model workflow groups menu | `HeaderBar` group picker cards (`min-h-[9rem]`) | Lucide icon only |
| Header → model category badges | `ProviderBadge` (`w-[12.25rem]` × `h-[53px]`) | Solid `surface-800` fill |
| Header apps menu + App Summary → Apps | `AppsLauncherGrid` cards (`~233×93`, `p-4`) | Text only, no background art |
| Color Palette Maker → mode toolbar | `ColorModeIconBar` (`54×54` buttons, ~40×40 preview) | CSS gradients in `ColorModeIconPreview` |
| Camera panel → Shot Workflow dropdown | `WorkflowDropdown` (`#studio-shot-workflow`, `VisualDropdown` md trigger ~212×56) | Text only, no `imageUrl` on options |

---

## Global conventions (all raster assets)

Inherit from `prompts.json` `conventions` unless a section below overrides.

- **Palette:** Dark desaturated tones compatible with charcoal UI (`#18181b` / `#27272a` surfaces). Muted, not neon.
- **Medium:** Pure photography for raster backgrounds (not illustration, not 3D-render look, not flat vector).
- **Environment:** Neutral gray seamless studio unless the concept needs a minimal prop or abstract primitive (see `composition` / `lenses` sections in `prompts.json`).
- **noText:** Zero typography — no words, letters, numbers, logos, watermarks, UI chrome.
- **Grok defaults:** `grok-imagine-image`, `grokAspectRatio: "16:9"`, `grokResolution: "1k"`, post-process to target size before commit.
- **Display pattern:** Match `VisualDropdown` — thumbnail on the **right** ~42% of control, label area on the left with left-to-right gradient shade (see `.visual-dropdown__trigger-thumb` in `app/globals.css`).

### Master → display sizes

| Asset family | Master (commit) | UI display | Format |
|--------------|-----------------|------------|--------|
| Model category icon | 128×128 | 24×24 (`w-6 h-6` chip) | **SVG** (vector) |
| Workflow group card background | 640×360 | ~235×144 card, cover right zone | JPG |
| Provider badge background | 640×360 | 196×53 badge, cover right zone | JPG |
| Studio / app launcher card background | 640×280 | ~233×93 card, cover right ~45% or full-bleed under gradient | JPG |
| Color palette mode preview | 128×128 | ~40×40 in `3.375rem` toolbar button | JPG |
| Shot workflow dropdown thumbnail | 640×360 | ~89×56 right crop in md trigger (~42%) | JPG |

---

## File layout (proposed)

```
public/stock/
  app-styling/
    prompts.json                    ← extend or sibling to cinematography prompts
    model-categories/               ← 128×128 SVG icons (one per category ID)
      mask-inpaint.svg
      …
    model-workflow-groups/          ← JPG backgrounds for group picker cards
      image-video.jpg
      …
    model-category-badges/          ← JPG backgrounds for header ProviderBadge
      mask-inpaint.jpg
      …
    studio-launcher/                ← JPG backgrounds for AppsLauncherGrid cards
      shot-designer.jpg
      …
    color-palette-modes/            ← JPG mode previews for ColorModeIconBar
      color.jpg
      …
    shot-workflows/                 ← JPG thumbnails for WorkflowDropdown (camera panel)
      bake-start-frame.jpg
      …
```

**App wiring (follow-up tasks, not image gen):**

- [ ] Register icons in `lib/constants/model-catalog.ts` (or `model-category-icons.ts`) → `getModelCategoryIconUrl(categoryId)`
- [ ] Use icon URL in `AppSummaryPanel` chip thumbnail
- [ ] Add optional `backgroundImage` to `MODEL_UX_GROUPS` entries in `HeaderBar.tsx`
- [ ] Add optional `backgroundImage` per category badge card in `ProviderBadge` / `HeaderBar`
- [ ] Add `backgroundImage` to `StudioLauncherItem` in `lib/constants/studio-launcher.ts`; render in `AppsLauncherGrid` (right thumbnail + left gradient shade, same pattern as `VisualDropdown`)
- [ ] Register mode preview URLs in `lib/constants/color-palette.ts`; replace `ColorModeIconPreview` gradients in `components/ui/ColorModeSegment.tsx` with `<img>` / `background-image`
- [ ] Add `imageUrl` per workflow in `lib/constants/video-generation-workflows.ts` (or helper `workflowThumbnail(id)`); pass through `WorkflowDropdown` → `VisualDropdown` options

---

## 1. Model category icons (128×128 vector)

**Purpose:** Chip thumbnail in App Summary feature checklist (`Requires` row) and anywhere a category is shown without a provider logo.

**Format:** SVG, 128×128 viewBox, single-color or two-tone glyph on transparent background. Stroke weight consistent across set (~2px at 128px). Charcoal / zinc palette (`#a1a1aa` primary, `#52525b` secondary). No photographic detail — symbolic UI icons, same *clarity* as dropdown thumbnails but vector-flat.

**Prompt / design direction:** One unmistakable metaphor per category (film-school or post-production concept). Avoid provider branding.

### Bake & still image

- [ ] `mask-inpaint` — **Mask inpaint** — Frame with irregular mask cutout; regenerated region subtly brighter inside silhouette hole.
- [ ] `image-edit` — **Image edit** — Full frame with soft global adjustment wave / brush pass across entire image (no mask).
- [ ] `multi-image-identity-edit` — **Multi-image identity edit** — Central figure silhouette with two smaller reference portraits merging in (identity swap).
- [ ] `text-to-image` — **Text to image** — Empty gray frame with faint spark / bloom emerging from center (creation from nothing).
- [ ] `image-to-image` — **Image to image** — Two stacked frames, top slightly offset, showing structure preserved / style shift.
- [ ] `image-outpaint` — **Image outpaint** — Frame with dashed extension borders beyond original canvas edges.
- [ ] `image-upscale` — **Image upscale** — Small pixel grid resolving into sharper larger square (resolution up).
- [ ] `image-segmentation` — **Image segmentation** — Figure silhouette divided into flat labeled-like regions (no text) in varied grays.
- [ ] `image-background-removal` — **Image background removal** — Subject cutout with checkerboard-free transparent hint (gray void around figure).
- [ ] `pose-estimation` — **Pose estimation** — Matte gray mannequin outline with joint dots and limb bones (stick-figure overlay on mannequin shape).

### Video generation & motion

- [ ] `text-to-video` — **Text to video** — Film strip or timeline segment materializing from gray fog.
- [ ] `image-to-video` — **Image to video** — Single still frame with motion-blur streak exiting rightward.
- [ ] `reference-to-video` — **Reference to video** — Multiple small ref thumbnails feeding into one film frame.
- [ ] `first-last-frame` — **First and last frame** — Two keyframes at ends of arrow / bridge between them.
- [ ] `video-extension` — **Video extension** — Clip strip with dashed continuation segment appended.
- [ ] `camera-control` — **Camera control** — Tripod head or dolly track arc with camera glyph.
- [ ] `motion-transfer` — **Motion transfer** — Stick figure pose arrow copied from one body to another.
- [ ] `multi-shot` — **Multi-shot sequence** — Three adjacent frame panels, slight angle change per panel.
- [ ] `video-edit` — **Video edit** — Film strip with color-grade wedge across middle.
- [ ] `video-inpaint` — **Video inpaint** — Film strip frame with masked region filled in.
- [ ] `character-replace` — **Character replace** — Same motion path, two different silhouettes swapped on timeline.

### Finish, audio & language

- [ ] `lip-sync` — **Lip sync** — Face profile with mouth waveform aligned to audio wave beneath.
- [ ] `text-to-speech` — **Text to speech** — Speech bubble shape (empty) emanating sound waves (no letters).
- [ ] `speech-to-text` — **Speech to text** — Sound wave collapsing into horizontal lines (transcript abstraction, no letters).
- [ ] `voice-cloning` — **Voice cloning** — Two matching waveforms, one ghosted from the other.
- [ ] `audio-separation` — **Audio separation** — Single mixed wave splitting into parallel stems.
- [ ] `video-to-audio` — **Video to audio** — Silent film frame with emerging sound rings / Foley symbols (no text).
- [ ] `llm` — **LLM prompt assist** — Abstract node graph / branching lines (no words).

### Compositing, quality & control

- [ ] `video-matting` — **Video matting** — Figure with soft alpha fringe / extraction matte edge.
- [ ] `video-compositing-inpaint` — **Video compositing inpaint** — Two layers with seam line being healed.
- [ ] `video-compositing-generative` — **Video compositing generative** — Multiple layers merging into one cohesive frame.
- [ ] `video-upscale` — **Video upscale** — Small video window sharpening to HD rectangle.
- [ ] `frame-interpolation` — **Frame interpolation** — Three frames with middle ghost frame between endpoints.
- [ ] `video-segmentation` — **Video segmentation** — Film strip with mask shape tracking across frames.
- [ ] `control-reference` — **Control reference** — Depth map + edge map side-by-side thumbnails.
- [ ] `depth-estimation` — **Depth estimation** — Grayscale depth ramp of simple primitives receding in Z.

---

## 2. Model workflow group backgrounds (raster)

**Purpose:** Background art for **Model workflow groups** picker in header (`HeaderBar` → `MODEL_UX_GROUPS` cards). Card is `min-h-[9rem]`, ~3-column grid; image should read at small size on right portion like `VisualDropdown`.

**Inherits:** Global raster conventions + `prompts.json` `promptTemplate` spirit — one clear concept per card.

**Output:** `public/stock/app-styling/model-workflow-groups/{id}.jpg` — 640×360 master.

- [ ] `image-video` — **Image / video** — Default generation picks. Medium shot mannequin in gray studio with still frame on easel + faint motion streak on same scene (generate still + animate).
- [ ] `image-editing` — **Image editing** — Bake / manipulation. Mannequin composite on backdrop with visible mask brush edge and identity sheet floating beside frame.
- [ ] `video-workflows` — **Video workflows** — Primary generation. Clapperboard-gray sculpt, film strip, mannequin in MS framing, multi-ref thumbnails tucked in corner.
- [ ] `finish-audio` — **Finish + audio** — Dialogue / voice / Foley. Mannequin profile with waveform and microphone sculpt (gray hard-surface, no brand).
- [ ] `quality` — **Quality** — Upscaling / interpolation. Same MS mannequin with sharp vs soft duplicate edge hint (resolution / smooth motion).
- [ ] `advanced` — **Advanced** — Compositing / segmentation / control. Layered frames, matte fringe, depth primitive map collage in gray studio.

---

## 3. Provider badge backgrounds (raster, per model category)

**Purpose:** Right-zone background for header `ProviderBadge` buttons (`196×53` display, category label + provider + model on left). One image per **model category** that can appear in the badge strip (all `MODEL_CATEGORY_DEFINITIONS` IDs).

**Inherits:** Global raster conventions. Framing tighter than workflow cards — concept must read in ~82×53px thumbnail crop (42% of badge width).

**Output:** `public/stock/app-styling/model-category-badges/{categoryId}.jpg` — 640×360 master.

Use the same metaphor as the vector icon where possible, but photographed / studio-still execution (like lens or composition dropdowns).

### Bake & still image

- [ ] `mask-inpaint` — Masked mannequin silhouette on backdrop; inpainted region inside mask only.
- [ ] `image-edit` — Full composite with global semantic edit (wardrobe tone shift), no mask.
- [ ] `multi-image-identity-edit` — Scene plate plus character sheet corner; identity applied on figure.
- [ ] `text-to-image` — Empty gray studio gradually forming mannequin from light bloom.
- [ ] `image-to-image` — Side-by-side before/after still, same pose, shifted grade.
- [ ] `image-outpaint` — Backdrop plate with extended seamless border beyond frame line.
- [ ] `image-upscale` — CU mannequin face: soft left half, sharp right half.
- [ ] `image-segmentation` — Mannequin MS with flat color-region segmentation overlay.
- [ ] `image-background-removal` — Mannequin cutout on neutral void.
- [ ] `pose-estimation` — Photo drop → mannequin match (single mannequin, standardPose, joint hints).

### Video generation & motion

- [ ] `text-to-video` — Empty studio with motion-blur figure forming from haze.
- [ ] `image-to-video` — MS still with directional motion blur trail.
- [ ] `reference-to-video` — MS mannequin with 2–3 small reference prints on floor.
- [ ] `first-last-frame` — Two MS poses at strip ends, bridge blur between.
- [ ] `video-extension` — Film strip continuing past visible end marker.
- [ ] `camera-control` — MS mannequin, camera on dolly track implied in studio floor.
- [ ] `motion-transfer` — Mannequin mirroring pose from small reference screen.
- [ ] `multi-shot` — Three-panel triptych, same mannequin, varied angle.
- [ ] `video-edit` — MS mannequin, half frame warm grade, half cool.
- [ ] `video-inpaint` — MS with masked object region mid-fill.
- [ ] `character-replace` — Same walk pose, two mannequin identities swapped.

### Finish, audio & language

- [ ] `lip-sync` — MCU mannequin profile, mouth slightly open, waveform beside.
- [ ] `text-to-speech` — Studio microphone sculpt, gray, with abstract sound rings.
- [ ] `speech-to-text` — Waveform on monitor sculpt (no readable text).
- [ ] `voice-cloning` — Twin waveforms, matched shape.
- [ ] `audio-separation` — One waveform splitting into parallel tracks.
- [ ] `video-to-audio` — Silent MS scene with subtle ripple / ambience visualization.
- [ ] `llm` — Gray desk with abstract branching nodes (no text).

### Compositing, quality & control

- [ ] `video-matting` — Mannequin with soft alpha edge on checker-free gray.
- [ ] `video-compositing-inpaint` — Two plates, visible seam being blended.
- [ ] `video-compositing-generative` — Triple exposure merge into one MS.
- [ ] `video-upscale` — Small inset frame sharpening to full MS.
- [ ] `frame-interpolation` — Three-frame ghosting between two MS poses.
- [ ] `video-segmentation` — Strip of 3 frames, mask tracking mannequin.
- [ ] `control-reference` — Depth + canny maps of mannequin MS on easels.
- [ ] `depth-estimation` — Primitives or mannequin with grayscale depth ramp.

### Default provider badges (non-category)

These use the same badge chrome but are **default** video/image picks, not catalog categories:

- [ ] `default-video` — MS mannequin with motion streak (header Video badge).
- [ ] `default-image` — MS mannequin still on easel (header Image badge).

---

## 4. Studio / app launcher card backgrounds (raster)

**Purpose:** Background art for every entry in `STUDIO_LAUNCHER_ITEMS` — shown in `AppsLauncherGrid` (header **Apps** menu `#studio-header-apps-menu` and App Summary **Apps** section). Cards are `rounded-xl`, `p-4`, ~`233×93` in the 2-column grid.

**Inherits:** Global raster conventions. Each image should communicate the **studio's job** at a glance (same mannequin identity where people appear). Layout target: thumbnail on the **right** ~45% with title/description on the left over a left-to-right gradient (match `VisualDropdown` / workflow group cards).

**Output:** `public/stock/app-styling/studio-launcher/{id}.jpg` — 640×280 master (≈2.3∶1; crop-friendly for card aspect).

**Source IDs:** `lib/constants/studio-launcher.ts` → `STUDIO_LAUNCHER_ITEMS`.

### Core studios

- [ ] `shot-designer` — **Shot Designer** — MS mannequin on gray backdrop with overhead diagram of camera + subject blocking (no drawn labels); storyboard frames stacked behind. *Design shots, block framing, and generate video.*
- [ ] `media-library` — **Media Library** — Grid of small film frames and reference prints on studio wall / light table; organized archive feel. *Browse project media assets, references, and generated clips.*

### Reference & look tools (`STUDIO_APPS`)

- [ ] `character-sheet-generator` — **Character Manager** — Turnaround sheet easel: front/side mannequin sculpt views on gray boards (no text on sheets). *Create and manage named characters with reference sheets.*
- [ ] `location-manager` — **Location Manager** — Stacked backdrop plates on c-stands; distinct gray studio environments receding in depth. *Create and manage named locations with backdrop plates.*
- [ ] `film-look-maker` — **Film Look Maker** — Same MS mannequin with split-tone grade preview (warm/cool halves); film-strip sculpt along bottom. *Apply cinematic look recipes and film-stock emulations.*
- [ ] `color-palette-maker` — **Color Palette Maker** — Row of desaturated tonal swatch tiles (gray-violet steps, no readable labels) beside MS mannequin still. *Create and apply color palettes to image references.*
- [ ] `image-editor` — **Image Editor** — Reference print on light table with soft brush-stroke adjustment zone; gray sculpt tools at edge. *Edit references with procedural and AI-powered tools.*

### System

- [ ] `settings` — **Settings** — Abstract gray sculpt of connected nodes / key shapes (provider hubs metaphor); no logos, no readable API text. *AI providers, models, and API keys.*

---

## 5. Color palette mode previews (raster)

**Purpose:** Thumbnail inside each `ColorModeIconBar` toolbar button in **Color Palette Maker** (`ColorPaletteMakerPanel` → `ColorModeIconBar`). Replaces inline CSS gradients in `ColorModeIconPreview` (`components/ui/ColorModeSegment.tsx`). Button chrome is `size-[3.375rem]` (54px) with label under preview; image fills the top ~40×40px rounded rect.

**Inherits:** `prompts.json` mannequin + studio identity (`shot-types/ms.jpg` / `mannequin-identity.jpg`) as the **same base plate** for every mode — only the grade / treatment changes. `noText` still applies.

**Exception:** These assets **must** demonstrate color treatments (full color, monochrome, false-color thermal, duotone split, accent spot color). Saturation is allowed where the mode requires it; keep backgrounds charcoal-friendly and avoid neon UI chrome.

**Output:** `public/stock/app-styling/color-palette-modes/{mode}.jpg` — 128×128 square master.

**Source IDs:** `ColorPaletteMode` in `lib/types/studio.ts`; labels from `FX_MODE_LABELS` + primary modes in `ColorModeSegment.tsx`.

**Consistency:** Generate `color.jpg` first (neutral grade MS mannequin waist-up). Pass as `image_paths` when generating graded variants so framing, pose, and identity match.

- [ ] `color` — **Color** — Naturalistic muted cinematic color on MS mannequin; balanced skin-tone gray sculpt, subtle wardrobe separation, charcoal studio backdrop.
- [ ] `bw` — **B&W** — Same plate fully desaturated; rich tonal range from deep charcoal shadows to light gray highlights on mannequin face.
- [ ] `false-color` — **False Color** — Same plate with thermal / scientific false-color map (blue shadows → green midtones → yellow-red highlights); reads as analysis overlay, not realistic skin.
- [ ] `duotone` — **Duotone** — Same plate split into two dominant hues (e.g. deep violet shadows, warm amber highlights) across entire frame.
- [ ] `accent-splash` — **Accent Splash** — Same plate mostly desaturated gray; single small warm accent region (e.g. mannequin belt buckle or cheek highlight) in saturated orange-red.
- [ ] `off` — **Off** — Empty neutral gray studio frame / dashed-border void metaphor — no mannequin, or extremely faint ghost silhouette; reads as “palette disabled” (match current dashed placeholder intent).

---

## 6. Shot workflow dropdown thumbnails (raster)

**Purpose:** Right-zone thumbnail for every option in the **Shot Workflow** picker (`WorkflowDropdown` in camera panel → `#studio-shot-workflow`). Trigger is `VisualDropdown` md (`visual-dropdown__trigger--md`, `thumbnailRight`) — same layout as field size / lens dropdowns: label on left, image on right ~42% with left-to-right gradient shade.

**Inherits:** Global raster conventions + `prompts.json` mannequin identity (`shot-types/ms.jpg` / `mannequin-identity.jpg`) wherever a character appears. Concept must read in ~89×56px crop at trigger size and in list-menu rows.

**Output:** `public/stock/app-styling/shot-workflows/{id}.jpg` — 640×360 master.

**Source IDs:** `video-generation-workflows.json` → `Workflow` type in `lib/types/studio.ts`. Groups match JSON sections below.

**Consistency:** Generate `bake-start-frame.jpg` first (canonical mannequin-on-backdrop bake metaphor). Reuse as `image_paths` reference for other character-centric workflows where the same gray mannequin + studio identity applies.

### Character Workflows

- [ ] `bake-start-frame` — **Bake Start Frame** — MS gray mannequin blocking on backdrop plate; baked photoreal face region emerging inside mannequin silhouette (locked first frame before motion). *Mannequins block framing; bake composites character(s); video adds motion only.*
- [ ] `auto-place` — **Auto-place Character** — MS mannequin faint on backdrop with character sheet print floating beside frame; motion-blur streak exiting right (no bake step — model infers placement). *Fast iteration; optional mannequin blocking.*

### Environment Workflows

- [ ] `pure-broll` — **Pure B-roll (no character)** — Empty gray studio / landscape backdrop only; slow crane-up fog or atmosphere, no figure. *Backdrop or T2V; field size / lens / angle drive generation; no character sheet.*
- [ ] `start-end` — **Start & End Frame** — Two MS keyframes at opposite ends of a bridge / arrow blur between them (opening and closing look). *Product reveals, logo landings; model interpolates between baked endpoints.*

### Motion Workflows

- [ ] `motion-transfer` — **Motion Transfer / Performance** — MS mannequin mirroring pose from small reference video screen on studio floor; motion path arrow copied body-to-body. *Upload reference video, apply to character; framing follows motion.*
- [ ] `multi-shot` — **Multi-shot Sequence** — Three adjacent MS panels, same mannequin, slight angle / coverage change per panel (shot-list triptych). *One prompt → 3–6 connected shots; subject count becomes shot list.*

### Camera Workflows

- [ ] `camera-control` — **Camera Control** — Static MS mannequin scene with dolly track / crane arc and camera glyph implied on charcoal studio floor; no body animation. *Crane, dolly, pan, tilt, orbit on static scene or first frame.*

### Edit Workflows

- [ ] `video-inpaint` — **Video Inpaint / Object Removal** — Film-strip MS frame with masked object region mid-fill / healing; temporally consistent background showing through. *Remove objects, people, blemishes from existing footage.*

### Utility Workflows

- [ ] `restyle-lipsync` — **Re-style / Lip-sync** — MCU mannequin profile on existing footage plate; half frame warm re-grade, mouth slightly open with waveform beside. *Restyle existing footage or add speech; backdrop is the video itself.*

---

## 7. `prompts.json` integration

- [ ] Add `appStyling` section to `public/stock/prompts.json` (or `public/stock/app-styling/prompts.json`) mirroring `sectionConventions` structure.
- [ ] Document `outputSpec` overrides for 128×128 SVG vs 640×360 JPG families.
- [ ] Add `appWiring` notes per section (which React component consumes which path), including `shot-workflows/` → `WorkflowDropdown`.
- [ ] Generate anchor image for `advanced` group first; use as `image_paths` reference for other group cards in same family if needed.

---

## 8. QA checklist (before merge)

- [ ] All assets pass `noText` grep / visual inspection.
- [ ] Icons readable at 24×24 and 32×32.
- [ ] Badge backgrounds readable in 82×53 crop (right 42% of 196×53).
- [ ] Workflow group backgrounds readable at card thumbnail size in 3-column grid.
- [ ] Studio launcher backgrounds readable at ~100×93 right crop and under left gradient at 233×93 card size.
- [ ] Color mode previews distinguishable at ~40×40; same mannequin framing across `color`–`accent-splash` set.
- [ ] Shot workflow thumbnails readable at ~89×56 right crop in md `VisualDropdown` trigger and in list-menu rows.
- [ ] All nine `Workflow` IDs from `video-generation-workflows.json` have matching JPG assets.
- [ ] Palette matches existing `public/stock/shot-types/ms.jpg` / `subject-counts` set (side-by-side in UI).
- [ ] File names match `ModelCategoryId`, `StudioLauncherItemId`, `ColorPaletteMode`, and `Workflow` slugs exactly.
- [ ] SVGs optimized (svgo); JPGs ≤ 80 KB where possible at 640×360 / 640×280 / 128×128.

---

## Related files

- `public/stock/prompts.json` — cinematography preview prompts (style bible)
- `project-plans/MODEL-CATALOG.md` — category definitions and examples
- `components/studio/AppSummaryPanel.tsx` — checklist chip placeholders
- `components/studio/HeaderBar.tsx` — `MODEL_UX_GROUPS`, badge strip
- `components/studio/ProviderBadge.tsx` — header category badges
- `components/studio/AppsLauncherGrid.tsx` — studio app cards (header menu + App Summary)
- `lib/constants/studio-launcher.ts` — `STUDIO_LAUNCHER_ITEMS` IDs and copy
- `components/ui/ColorModeSegment.tsx` — `ColorModeIconBar`, `ColorModeIconPreview`
- `components/studio/ColorPaletteMakerPanel.tsx` — hosts the mode toolbar
- `lib/constants/color-palette.ts` — `FX_COLOR_MODES`, `FX_MODE_LABELS`
- `components/ui/VisualDropdown.tsx` — dropdown thumbnail layout reference
- `video-generation-workflows.json` — shot workflow IDs, labels, groups (source of truth)
- `lib/constants/video-generation-workflows.ts` — workflow loader + `IMPLEMENTED_WORKFLOWS`
- `components/studio/WorkflowDropdown.tsx` — `#studio-shot-workflow` picker
- `components/studio/CameraPanel.tsx` — hosts `WorkflowSection` / workflow dropdown
