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
- **Visual vocabulary (app styling):** Prefer **traditional filmmaking equipment and set dressing** over mannequins for raster backgrounds and mode previews. Default subject matter: matte gray hard-surface sculpts of cinema gear — ARRI-style cinema camera bodies, c-stands with grip heads, Fresnel / LED panel / softbox lights, gel frames and diffusion scrims, flags and cutters, dolly track, clapperboard, boom mic, light meter, reference monitors, backdrop rolls on stands, storyboard prints on easels. Same unified matte gray sculpt material as `prompts.json` `lenses` section (no brand logos, no readable markings). **Mannequins only when the concept is explicitly about characters** — bake blocking, pose estimation, character replace, identity sheets — not as a generic filler subject.
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
- [x] Add optional `backgroundImage` to `MODEL_UX_GROUPS` entries in `HeaderBar.tsx`
- [ ] Add optional `backgroundImage` per category badge card in `ProviderBadge` / `HeaderBar`
- [x] Add `backgroundImage` to `StudioLauncherItem` in `lib/constants/studio-launcher.ts`; render in `AppsLauncherGrid` (right thumbnail + left gradient shade, same pattern as `VisualDropdown`)
- [ ] Register mode preview URLs in `lib/constants/color-palette.ts`; replace `ColorModeIconPreview` gradients in `components/ui/ColorModeSegment.tsx` with `<img>` / `background-image`
- [ ] Add `imageUrl` per workflow in `lib/constants/video-generation-workflows.ts` (or helper `workflowThumbnail(id)`); pass through `WorkflowDropdown` → `VisualDropdown` options

---

## 1. Model category icons (128×128 vector)

**Purpose:** Chip thumbnail in App Summary feature checklist (`Requires` row) and anywhere a category is shown without a provider logo.

**Format:** SVG, 128×128 viewBox, single-color or two-tone glyph on transparent background. Stroke weight consistent across set (~2px at 128px). Charcoal / zinc palette (`#a1a1aa` primary, `#52525b` secondary). No photographic detail — symbolic UI icons, same *clarity* as dropdown thumbnails but vector-flat.

**Prompt / design direction:** One unmistakable metaphor per category (film-school or post-production concept). Prefer equipment and set-dressing glyphs over figure silhouettes unless the category is character-specific. Avoid provider branding.

### Bake & still image

- [ ] `mask-inpaint` — **Mask inpaint** — Frame with irregular mask cutout; regenerated region subtly brighter inside silhouette hole.
- [ ] `image-edit` — **Image edit** — Full frame with soft global adjustment wave / brush pass across entire image (no mask).
- [ ] `multi-image-identity-edit` — **Multi-image identity edit** — Central figure silhouette with two smaller reference portraits merging in (identity swap).
- [ ] `text-to-image` — **Text to image** — Empty gray frame with faint spark / bloom emerging from center (creation from nothing).
- [ ] `image-to-image` — **Image to image** — Two stacked frames, top slightly offset, showing structure preserved / style shift.
- [ ] `image-outpaint` — **Image outpaint** — Frame with dashed extension borders beyond original canvas edges.
- [ ] `image-upscale` — **Image upscale** — Small pixel grid resolving into sharper larger square (resolution up).
- [ ] `image-segmentation` — **Image segmentation** — Fresnel light sculpt divided into flat labeled-like regions (no text) in varied grays.
- [ ] `image-background-removal` — **Image background removal** — Cinema camera cutout with checkerboard-free transparent hint (gray void around object).
- [ ] `pose-estimation` — **Pose estimation** — Articulated pose reference armature or stick-figure overlay on a neutral gray sculpt (joint dots and limb bones; no full mannequin body).

### Video generation & motion

- [ ] `text-to-video` — **Text to video** — Film strip or timeline segment materializing from gray fog.
- [ ] `image-to-video` — **Image to video** — Single still frame with motion-blur streak exiting rightward.
- [ ] `reference-to-video` — **Reference to video** — Multiple small ref thumbnails feeding into one film frame.
- [ ] `first-last-frame` — **First and last frame** — Two keyframes at ends of arrow / bridge between them.
- [ ] `video-extension` — **Video extension** — Clip strip with dashed continuation segment appended.
- [ ] `camera-control` — **Camera control** — Tripod head or dolly track arc with camera glyph.
- [ ] `motion-transfer` — **Motion transfer** — Motion path arrow copied from reference monitor to blocking marks on floor.
- [ ] `multi-shot` — **Multi-shot sequence** — Three adjacent frame panels, slight angle change per panel.
- [ ] `video-edit` — **Video edit** — Film strip with color-grade wedge across middle.
- [ ] `video-inpaint` — **Video inpaint** — Film strip frame with masked region filled in.
- [ ] `character-replace` — **Character replace** — Same motion path, two different silhouettes swapped on timeline.

### Finish, audio & language

- [ ] `lip-sync` — **Lip sync** — Boom mic profile with mouth-shaped waveform aligned to audio wave beneath.
- [ ] `text-to-speech` — **Text to speech** — Speech bubble shape (empty) emanating sound waves (no letters).
- [ ] `speech-to-text` — **Speech to text** — Sound wave collapsing into horizontal lines (transcript abstraction, no letters).
- [ ] `voice-cloning` — **Voice cloning** — Two matching waveforms, one ghosted from the other.
- [ ] `audio-separation` — **Audio separation** — Single mixed wave splitting into parallel stems.
- [ ] `video-to-audio` — **Video to audio** — Silent film frame with emerging sound rings / Foley symbols (no text).
- [ ] `llm` — **LLM prompt assist** — Abstract node graph / branching lines (no words).

### Compositing, quality & control

- [ ] `video-matting` — **Video matting** — C-stand flag with soft alpha fringe / extraction matte edge.
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

- [x] `image-video` — **Image / video** — Default generation picks. Cinema camera on c-stand beside a still-frame print on easel; faint motion streak across the same gray set (generate still + animate).
- [x] `image-editing` — **Image editing** — Bake / manipulation. Backdrop roll on stand with visible mask brush edge; reference print and light table at frame edge.
- [x] `video-workflows` — **Video workflows** — Primary generation. Clapperboard-gray sculpt, film strip, ARRI-style camera on dolly track, multi-ref thumbnails tucked in corner.
- [x] `finish-audio` — **Finish + audio** — Dialogue / voice / Foley. Boom mic and studio microphone sculpt with waveform beside (gray hard-surface, no brand).
- [x] `quality` — **Quality** — Upscaling / interpolation. Reference monitor showing same frame sharp vs soft duplicate edge hint (resolution / smooth motion).
- [x] `advanced` — **Advanced** — Compositing / segmentation / control. Layered frames, matte fringe, depth primitive map collage in gray studio.

---

## 3. Provider badge backgrounds (raster, per model category)

**Purpose:** Right-zone background for header `ProviderBadge` buttons (`196×53` display, category label + provider + model on left). One image per **model category** that can appear in the badge strip (all `MODEL_CATEGORY_DEFINITIONS` IDs).

**Inherits:** Global raster conventions. Framing tighter than workflow cards — concept must read in ~82×53px thumbnail crop (42% of badge width).

**Output:** `public/stock/app-styling/model-category-badges/{categoryId}.jpg` — 640×360 master.

Use the same metaphor as the vector icon where possible, but photographed / studio-still execution (like `lenses/` or `composition/` dropdowns). Default to equipment on set — mannequins only for character-explicit categories (`pose-estimation`, `character-replace`, `multi-image-identity-edit`).

### Bake & still image

- [ ] `mask-inpaint` — Masked region on backdrop roll; inpainted fill inside irregular mask cutout only.
- [ ] `image-edit` — Full composite with global semantic edit (warm/cool grade shift across entire frame), no mask.
- [ ] `multi-image-identity-edit` — Scene plate on easel plus character reference sheet corner; identity merge metaphor.
- [ ] `text-to-image` — Empty gray studio with light bloom materializing a cinema camera sculpt from haze.
- [ ] `image-to-image` — Side-by-side before/after still prints on easel, same composition, shifted grade.
- [ ] `image-outpaint` — Backdrop plate with extended seamless border beyond frame line.
- [ ] `image-upscale` — CU of lens barrel or monitor detail: soft left half, sharp right half.
- [ ] `image-segmentation` — Fresnel light on c-stand with flat color-region segmentation overlay.
- [ ] `image-background-removal` — Cinema camera cutout on neutral void.
- [ ] `pose-estimation` — Photo drop → pose armature match (articulated reference with joint hints).

### Video generation & motion

- [ ] `text-to-video` — Empty studio with motion-blur streak forming clapperboard from haze.
- [ ] `image-to-video` — Still print on easel with directional motion blur trail exiting frame.
- [ ] `reference-to-video` — Cinema camera setup with 2–3 small reference prints on floor.
- [ ] `first-last-frame` — Two keyframe prints at strip ends, bridge blur between.
- [ ] `video-extension` — Film strip continuing past visible end marker.
- [ ] `camera-control` — Cinema camera on dolly track with crane arc implied on charcoal studio floor.
- [ ] `motion-transfer` — Reference monitor on floor; motion path arrow copied to blocking tape marks.
- [ ] `multi-shot` — Three-panel triptych, same set dressing, varied camera angle per panel.
- [ ] `video-edit` — Reference monitor, half frame warm grade, half cool.
- [ ] `video-inpaint` — Film-strip frame with masked object region mid-fill.
- [ ] `character-replace` — Same blocking marks on floor, two different character sheet prints swapped (identity swap metaphor).

### Finish, audio & language

- [ ] `lip-sync` — Boom mic profile with waveform beside; mouth-shaped sculpt hint on mic windscreen (no face).
- [ ] `text-to-speech` — Studio microphone sculpt, gray, with abstract sound rings.
- [ ] `speech-to-text` — Waveform on monitor sculpt (no readable text).
- [ ] `voice-cloning` — Twin waveforms, matched shape.
- [ ] `audio-separation` — One waveform splitting into parallel tracks.
- [ ] `video-to-audio` — Silent set (camera + lights) with subtle ripple / ambience visualization.
- [ ] `llm` — Gray desk with abstract branching nodes (no text).

### Compositing, quality & control

- [ ] `video-matting` — C-stand with flag cutter, soft alpha edge on checker-free gray.
- [ ] `video-compositing-inpaint` — Two plates, visible seam being blended.
- [ ] `video-compositing-generative` — Triple exposure merge into one cohesive set still.
- [ ] `video-upscale` — Small inset monitor frame sharpening to full reference display.
- [ ] `frame-interpolation` — Three-frame ghosting between two keyframe prints.
- [ ] `video-segmentation` — Strip of 3 frames, mask tracking object across frames.
- [ ] `control-reference` — Depth + canny maps of cinema camera setup on easels.
- [ ] `depth-estimation` — Primitives receding in Z with grayscale depth ramp.

### Default provider badges (non-category)

These use the same badge chrome but are **default** video/image picks, not catalog categories:

- [ ] `default-video` — Cinema camera on dolly with motion streak (header Video badge).
- [ ] `default-image` — Still print on easel beside camera (header Image badge).

---

## 4. Studio / app launcher card backgrounds (raster)

**Purpose:** Background art for every entry in `STUDIO_LAUNCHER_ITEMS` — shown in `AppsLauncherGrid` (header **Apps** menu `#studio-header-apps-menu` and App Summary **Apps** section). Cards are `rounded-xl`, `p-4`, ~`233×93` in the 2-column grid.

**Inherits:** Global raster conventions. Each image should communicate the **studio's job** at a glance with a distinct metaphor per app (see prompts below). Layout target: thumbnail on the **right** ~45% with title/description on the left over a left-to-right gradient (match `VisualDropdown` / workflow group cards).

**Output:** `public/stock/app-styling/studio-launcher/{id}.jpg` — 640×280 master (≈2.3∶1; crop-friendly for card aspect).

**Source IDs:** `lib/constants/studio-launcher.ts` → `STUDIO_LAUNCHER_ITEMS`.

### Core studios

- [x] `shot-designer` — **Shot Designer** — Full studio set: cinema camera on dolly, matte gray mannequins blocking with tape marks, key light on c-stand. *Design shots, block framing, and generate video.*
- [x] `media-library` — **Media Library** — Glass display case with shelves of different media-type objects (reel, print, clapperboard, monitor, audio sculpt, contact sheet). *Browse project media assets, references, and generated clips.*

### Reference & look tools (`STUDIO_APPS`)

- [x] `character-sheet-generator` — **Character Manager** — Small character figurines only, full shot head-to-toe on plain studio floor (no backdrop). *Create and manage named characters with reference sheets.*
- [x] `location-manager` — **Location Manager** — Cube-shaped snow-globe dioramas with sealed mini scenes inside; low camera angle just above ground level. *Create and manage named locations with backdrop plates.*
- [x] `film-look-maker` — **Film Look Maker** — Close-up of c-stand grip head; film-grade objects in an orderly stacked/aligned layout (gel frames, film strip, grade strips, look chips). *Apply cinematic look recipes and film-stock emulations.*
- [x] `color-palette-maker` — **Color Palette Maker** — Close-up of same c-stand; swatch board and gel frames in a neat stacked/aligned layout. *Create and apply color palettes to image references.*
- [x] `image-editor` — **Image Editor** — Darkroom retouching station: print in tray, airbrush and spotting tools under red safelight. *Edit references with procedural and AI-powered tools.*

### System

- [x] `settings` — **Settings** — Dense physical config panel: knobs, toggles, sliders, rotary dials, push buttons — no screens or logos. *AI providers, models, and API keys.*

---

## 5. Color palette mode previews (raster)

**Purpose:** Thumbnail inside each `ColorModeIconBar` toolbar button in **Color Palette Maker** (`ColorPaletteMakerPanel` → `ColorModeIconBar`). Replaces inline CSS gradients in `ColorModeIconPreview` (`components/ui/ColorModeSegment.tsx`). Button chrome is `size-[3.375rem]` (54px) with label under preview; image fills the top ~40×40px rounded rect.

**Inherits:** Global raster conventions + equipment vocabulary. Use the **same base plate** for every mode — a compact gray-studio still of cinema gear (ARRI-style camera body + Fresnel key on c-stand, or gel frames on stand) — only the grade / treatment changes. `noText` still applies. Do **not** use mannequins as the base plate here.

**Exception:** These assets **must** demonstrate color treatments (full color, monochrome, false-color thermal, duotone split, accent spot color). Saturation is allowed where the mode requires it; keep backgrounds charcoal-friendly and avoid neon UI chrome.

**Output:** `public/stock/app-styling/color-palette-modes/{mode}.jpg` — 128×128 square master.

**Source IDs:** `ColorPaletteMode` in `lib/types/studio.ts`; labels from `FX_MODE_LABELS` + primary modes in `ColorModeSegment.tsx`.

**Consistency:** Generate `color.jpg` first (neutral grade: camera + key light on c-stand, tight product-style framing). Pass as `image_paths` when generating graded variants so framing and equipment identity match.

- [ ] `color` — **Color** — Naturalistic muted cinematic color on camera + Fresnel setup; subtle warm/cool separation on metal sculpt surfaces, charcoal studio backdrop.
- [ ] `bw` — **B&W** — Same plate fully desaturated; rich tonal range from deep charcoal shadows to light gray highlights on lens barrel and light housing.
- [ ] `false-color` — **False Color** — Same plate with thermal / scientific false-color map (blue shadows → green midtones → yellow-red highlights); reads as analysis overlay, not realistic materials.
- [ ] `duotone` — **Duotone** — Same plate split into two dominant hues (e.g. deep violet shadows, warm amber highlights) across entire frame.
- [ ] `accent-splash` — **Accent Splash** — Same plate mostly desaturated gray; single small warm accent region (e.g. gel frame edge or lens ring highlight) in saturated orange-red.
- [ ] `off` — **Off** — Empty neutral gray studio frame / dashed-border void metaphor — no equipment, or extremely faint ghost outline; reads as “palette disabled” (match current dashed placeholder intent).

---

## 6. Shot workflow dropdown thumbnails (raster)

**Purpose:** Right-zone thumbnail for every option in the **Shot Workflow** picker (`WorkflowDropdown` in camera panel → `#studio-shot-workflow`). Trigger is `VisualDropdown` md (`visual-dropdown__trigger--md`, `thumbnailRight`) — same layout as field size / lens dropdowns: label on left, image on right ~42% with left-to-right gradient shade.

**Inherits:** Global raster conventions + equipment vocabulary. Prefer set gear (camera, lights, c-stands, gels, monitors, dolly track) for every workflow thumbnail. **Mannequins only for `bake-start-frame`** — the one workflow where mannequin blocking is the literal product metaphor. Concept must read in ~89×56px crop at trigger size and in list-menu rows.

**Output:** `public/stock/app-styling/shot-workflows/{id}.jpg` — 640×360 master.

**Source IDs:** `video-generation-workflows.json` → `Workflow` type in `lib/types/studio.ts`. Groups match JSON sections below.

**Consistency:** Generate `camera-control.jpg` or `pure-broll.jpg` first as the canonical gray-studio equipment anchor. Pass as `image_paths` for other equipment-centric workflows. Generate `bake-start-frame.jpg` separately with mannequin identity (`shot-types/ms.jpg`) — do not reuse that plate for non-character workflows.

### Character Workflows

- [ ] `bake-start-frame` — **Bake Start Frame** — MS gray mannequin blocking on backdrop plate; baked photoreal face region emerging inside mannequin silhouette (locked first frame before motion). *Mannequins block framing; bake composites character(s); video adds motion only.* **(Only workflow that uses a mannequin.)**
- [ ] `auto-place` — **Auto-place Character** — Character reference sheet on easel beside backdrop roll; motion-blur streak exiting right (no bake step — model infers placement). *Fast iteration; optional mannequin blocking.*

### Environment Workflows

- [ ] `pure-broll` — **Pure B-roll (no character)** — Empty gray studio / landscape backdrop on c-stand only; slow crane-up fog or atmosphere, no figure. *Backdrop or T2V; field size / lens / angle drive generation; no character sheet.*
- [ ] `start-end` — **Start & End Frame** — Two keyframe prints on easels at opposite ends of a bridge / arrow blur between them (opening and closing look). *Product reveals, logo landings; model interpolates between baked endpoints.*

### Motion Workflows

- [ ] `motion-transfer` — **Motion Transfer / Performance** — Reference monitor on studio floor playing performance clip; motion path arrow copied to blocking tape marks on gray floor. *Upload reference video, apply to character; framing follows motion.*
- [ ] `multi-shot` — **Multi-shot Sequence** — Three adjacent panels: same set dressing, slight camera angle / coverage change per panel (shot-list triptych). *One prompt → 3–6 connected shots; subject count becomes shot list.*

### Camera Workflows

- [ ] `camera-control` — **Camera Control** — Cinema camera on dolly track with crane arc implied on charcoal studio floor; Fresnel key on c-stand, static scene — no subject animation. *Crane, dolly, pan, tilt, orbit on static scene or first frame.*

### Edit Workflows

- [ ] `video-inpaint` — **Video Inpaint / Object Removal** — Film-strip frame with masked object region mid-fill / healing; temporally consistent background showing through. *Remove objects, people, blemishes from existing footage.*

### Utility Workflows

- [ ] `restyle-lipsync` — **Re-style / Lip-sync** — Reference monitor on existing footage plate; half frame warm re-grade, boom mic with waveform beside. *Restyle existing footage or add speech; backdrop is the video itself.*

---

## 7. `prompts.json` integration

- [ ] Add `appStyling` section to `public/stock/prompts.json` (or `public/stock/app-styling/prompts.json`) mirroring `sectionConventions` structure.
- [ ] Document `outputSpec` overrides for 128×128 SVG vs 640×360 JPG families.
- [ ] Add `appWiring` notes per section (which React component consumes which path), including `shot-workflows/` → `WorkflowDropdown`.
- [ ] Add `equipmentIdentity` anchor (gray cinema camera + c-stand key light sculpt, same material rules as `lenses/standard.jpg`) for raster families that need consistency across a set.
- [ ] Generate anchor image for `advanced` group first; use as `image_paths` reference for other group cards in same family if needed.

---

## 8. QA checklist (before merge)

- [ ] All assets pass `noText` grep / visual inspection.
- [ ] Icons readable at 24×24 and 32×32.
- [ ] Badge backgrounds readable in 82×53 crop (right 42% of 196×53).
- [ ] Workflow group backgrounds readable at card thumbnail size in 3-column grid.
- [ ] Studio launcher backgrounds readable at ~100×93 right crop and under left gradient at 233×93 card size.
- [ ] Color mode previews distinguishable at ~40×40; same equipment framing across `color`–`accent-splash` set.
- [ ] Shot workflow thumbnails readable at ~89×56 right crop in md `VisualDropdown` trigger and in list-menu rows.
- [ ] All nine `Workflow` IDs from `video-generation-workflows.json` have matching JPG assets.
- [ ] Palette and sculpt material match existing cinematography set (`lenses/standard.jpg`, `shot-types/ms.jpg` gray tones) when shown side-by-side in UI.
- [ ] Raster app-styling assets use equipment/set vocabulary; mannequins appear only in `bake-start-frame` and character-explicit badge/icon entries (`pose-estimation`, `character-replace`, `multi-image-identity-edit`).
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
