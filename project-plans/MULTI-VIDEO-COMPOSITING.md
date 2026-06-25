# Multi-Video Compositing (Bake Start Frame mode)

**Status:** Research / design — not implemented

**Parent workflow:** Bake Start Frame → sub-mode **Multi-video compositing**

**Problem:** Single-pass image-to-video struggles when two or more principals perform **different** actions simultaneously (motion blending, identity swap, dialogue collision). `PROMPTS-FOR-VIDEO-GENERATION.md` recommends one primary action per character; compositing is VideoGen’s way to **enforce** that at the pipeline level instead of hoping the model complies.

**Product thesis:** Mannequin blocking already defines *where* each character lives in the frame. We reuse those masks, regions, and baked identity to generate **one video per principal**, then merge with matting + optional generative seam repair — the same separation-of-concerns idea as bake Pass 1 vs Pass 2, extended into **time**.

Cross-reference: `APP-SHAPE.md` (audio/lip-sync), `MODEL-CATALOG.md`, `MANNEQUINS-BAKE-START-FRAME.md`.

---

## When to use this mode

| Situation | Single I2V (default bake) | Multi-video compositing |
|-----------|----------------------------|------------------------|
| Two characters, low motion (standing, talking) | Often acceptable | Optional |
| Different actions per character (walk + sit, gesture + turn away) | Poor | **Recommended** |
| Dialogue with distinct lip performance per face | Risky in one pass | **Recommended** (silent layers → per-face lip-sync) |
| Crowd / 3+ principals | Poor | 2-way first; N-way later |
| Camera move affects whole frame | Shared plate easier | Need shared background motion strategy |

Default remains **single I2V** from the full baked frame. Multi-video is an explicit opt-in (checkbox or workflow variant) when subject count ≥ 2 and per-character performance fields differ.

---

## User-facing flow (target)

Same checklist as Bake Start Frame through **Assign Characters**. After bake (or in parallel conceptually):

1. **Enable multi-video compositing** on the shot.
2. **Define regions** — auto from mannequin masks (default) or adjust split line / feather width.
3. **Per-character performance** — action, expression, dialogue (already planned in bottom bar).
4. **Generate layers** — one silent (by default) I2V job per assigned principal.
5. **Composite** — merge layers onto a shared background plate; blend seam.
6. **Audio finish** — lip-sync / TTS per character (see below); optional native audio only on single-character previews.

User still clicks one **Generate**; orchestration is internal (like multi-pass bake identity).

---

## Pipeline architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SHARED (existing bake path)                                             │
│  Backdrop · Mannequins · Assign sheets · Bake → full start frame       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  Layer A      │       │  Layer B      │       │  Background   │
│  I2V (silent) │       │  I2V (silent) │       │  plate        │
│  char A only  │       │  char B only  │       │  (see below)  │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │  COMPOSITE            │
                    │  matting + placement  │
                    │  + seam blend         │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  AUDIO FINISH         │
                    │  lip-sync / mix       │
                    └───────────────────────┘
```

### Stage 1 — Region authoring (from mannequins)

VideoGen already renders **per-mannequin masks** at bake time (`maskBlob` in `BakeFrameOutput`). Reuse for:

- **Bounding region** per principal (normalized rect + optional feather).
- **Split line** for two-up layouts: vertical line at midpoint between sorted `mannequin.x`, or mask-derived seam path.
- **Spatial labels** (`leftmost`, `rightmost`) tied to layer IDs — same as identity pass.

Optional UI: overlay split line draggable in Framing preview; feather width in px.

### Stage 2 — Per-layer video generation

For each assigned principal:

| Input | Source |
|-------|--------|
| Start frame crop | Baked frame cropped to region **or** full-frame with strong mask hint in prompt |
| Identity | Already in baked pixels / character sheet |
| Prompt | **Only that character’s** compiled action + expression (silent proxies) |
| Audio mode | **Silent** (default) — avoids two native-audio tracks colliding before composite |

**Crop vs full-frame I2V:**

| Strategy | Pros | Cons |
|----------|------|------|
| **Tight crop** per character | Model sees one subject; less bleed | Must re-place exactly; edge artifacts at composite |
| **Full frame + mask-aware prompt** | Position locked to bake | Model may still animate both regions |
| **Isolated plate** (character on neutral/gray fill in crop) | Cleanest motion isolation | Extra bake or inpaint per layer |

**Recommended v1:** Tight crop from baked frame with 10–15% padding; re-composite using mannequin anchor `(x, y, scale, rotation)` from blocking.

Each layer can use the **same or different** I2V model (Settings → Models → draft video slot per layer — future).

### Stage 3 — Background plate

The merged shot needs pixels **behind** both characters (lighting, optional camera move).

| Strategy | Model category | Notes |
|----------|----------------|-------|
| **Static baked backdrop** | None | Simplest; characters move over fixed bg |
| **Backdrop-only I2V** | `camera-control` / minimal motion I2V | Animate empty baked plate (mannequins inpainted out in still first) |
| **Inpainted plate from layer A** | `video-inpaint` | Remove character A from A’s video → bg motion (see ProPainter) |
| **Shared plate from full silent gen** | `image-to-video` | Generate full-frame silent with “minimal motion, hold composition” — risky |

**Recommended v1:** Static backdrop from bake (backdrop blob without characters) or lightly animated **camera-control** pass on backdrop-only still.

### Stage 4 — Composite (merge layers)

Three tiers — implement bottom-up:

#### Tier A — Matting + deterministic composite (ship first)

1. Per layer video → **alpha matte** (Robust Video Matting or mannequin-shaped mask propagated).
2. Place each RGBA layer at mannequin transform per frame (affine from blocking; scale drift corrected at T=0).
3. **Feather** along seam (gradient alpha in overlap band).
4. Optional **color harmonization** (simple LAB stats match on seam strips) — classical comp, no ML.

| Model / tool | Provider | Role |
|--------------|----------|------|
| **Robust Video Matting (RVM)** | [Replicate `arielreplicate/robust_video_matting`](https://replicate.com/arielreplicate/robust_video_matting) | Human alpha matte, real-time, no trimap |
| **Canvas / FFmpeg** | Local | Over `{bg}{fgA}{fgB}` with alpha |
| **Mannequin mask propagation** | Client | Cheap fallback if RVM fails on stylized chars |

#### Tier B — Video inpainting for seam / background repair

When hard split leaves ghosts, seams, or overlapping edges:

1. Build a **seam mask** (band around split line ± N px) per frame or sparsely keyframed.
2. Run **video inpainting** on the preliminary composite to harmonize the band.

| Model | Provider | Role |
|-------|----------|------|
| **ProPainter** | [Replicate `jd7h/propainter`](https://replicate.com/jd7h/propainter) | Temporal inpainting; fill/remove objects across frames |
| **XMem + ProPainter** | Replicate bundles | Mask propagation + inpaint (noted for object replacement workflows) |
| **VideoPainter** | Research / emerging APIs | Plug-in context control for longer edits |

StM Decomposer (Google research) uses a similar stack: **motion segmentation → extract fg → inpaint bg hole** ([Split-then-Merge, arXiv:2511.20809](https://arxiv.org/html/2511.20809)). We invert the problem: we *have* fg layers and need bg + seam blend.

#### Tier C — Generative video composition (research / v2)

Merge **foreground video + background video** with learned harmonization (lighting, shadow, affordance):

| Model / paper | Availability | Fit |
|---------------|--------------|-----|
| **Split-then-Merge (StM) Composer** | Research (Google); not public API | Gold standard for fg+bg video merge; informs Tier B+C |
| **Runway Aleph 2.0** | [Runway API](https://docs.dev.runwayml.com/), [Runware](https://runware.ai/docs/models/runway-aleph) | In-context **video edit** — prompt only what changes: “harmonize lighting at center seam”, “add contact shadow under left figure” |
| **SkyReels / LayerFlow** | Limited | Compose from **static** fg/bg images — loses per-layer motion (StM paper shows failure mode) |

**Aleph prompt discipline:** Name **only** what changes (Runware docs). Good seam pass: *“Keep both people unchanged except blend the lighting and shadow in the vertical center band between them.”*

**Not a composite merge:** **Wan 2.2 Animate Replace** ([Replicate](https://replicate.com/wan-video/wan-2.2-animate-replace), [fal](https://fal.ai/models/fal-ai/wan/v2.2-14b/animate/replace)) — replaces a person in **one reference video** with an image. Useful for motion-transfer workflow, not merging two independently generated I2V clips.

---

## Lip-sync and audio strategy

Multi-video compositing aligns with **silent-first** (`APP-SHAPE.md`). Native audio on each layer before merge creates overlapping dialogue, conflicting ambience, and seam-sync nightmares.

### Recommended order: lip-sync **before** final composite (Path A)

```
Per character:
  silent I2V layer
    → lip-sync (layer video + that character's TTS/audio)
    → RGBA matte (RVM)

Then:
  composite all RGBA layers + background plate
    → mix audio tracks (character A pan / character B pan / optional bed)
```

**Why before composite:**

- Lip-sync models (Kling Lip Sync, Wav2Lip, VEED on fal) behave best with **one dominant face** per clip.
- Masks are trivial on single-character crops.
- Avoids running lip-sync through a seam where half the mouth is wrong pixels.

**Dialogue data:** Per-character **Dialogue** field → script export → TTS (`MODEL-CATALOG` → `text-to-speech`) → audio file per principal → lip-sync adapter input.

| Step | Model category | Examples |
|------|----------------|----------|
| TTS | `text-to-speech` | ElevenLabs on Replicate, OpenAI TTS |
| Lip-sync | `lip-sync` | Kling Lip Sync, [fal `veed/lipsync`](https://fal.ai/models/veed/lipsync), Replicate lipsync collection (Wav2Lip, SadTalker) |
| Audio mix | Local / ffmpeg | Two mono/stereo tracks; ducking optional |

### Alternative: lip-sync after composite (Path B — avoid for v1)

Run lip-sync on the **merged** video with **per-speaker audio** and multi-face tools (e.g. HeyGen multi-track). Harder because:

- Faces may be smaller after composite.
- Seam artifacts confuse mouth detection.
- Cross-talk timing must align across a single timeline.

Reserve for providers with explicit **multi-speaker** lip-sync APIs.

### Native audio mode

If user forces **Native** on a layer (Grok 1.5, Veo, etc.):

- Allow **only when compositing is disabled** OR **one native layer + others silent**.
- Do not merge two native-audio I2V clips without manual mute in media library.

### Audio mode defaults for this workflow

| Shot setting | Value |
|--------------|-------|
| Default audio mode | **Silent** on all layers |
| Lip-sync | **On** at finish (per character) |
| Ambience / SFX | Optional third pass: generate bed on background plate only, or import |

---

## Model catalog additions

New **Settings → Models** categories for this mode:

| Category ID | Label | Stage |
|-------------|-------|-------|
| `video-layer-i2v` | Per-layer video (I2V) | Layer gen (defaults to global I2V model) |
| `video-matting` | Video matting (alpha) | Composite |
| `video-compositing-inpaint` | Seam / plate inpaint | Composite Tier B |
| `video-compositing-generative` | Generative merge (Aleph) | Composite Tier C |
| `background-plate-i2v` | Background plate motion | Optional bg animate |

Add to `video-generation-workflows.json` as variant:

```json
{
  "id": "bake-start-frame-multi-composite",
  "label": "Bake Start Frame · Multi-video compositing",
  "extends": "bake-start-frame",
  "modelRequirements": {
    "capabilities": ["image-edit", "i2v", "video-matting"],
    "anyOf": ["video-compositing-inpaint", "video-compositing-generative"]
  }
}
```

(`video-matting` — new capability string in `workflow-capabilities.ts`.)

---

## Implementation phases

### Phase 0 — Design validation

- [ ] Prototype 2-character vertical split manually: two I2V crops from one baked frame → RVM → FFmpeg overlay.
- [ ] Measure seam quality with/without ProPainter band inpaint.
- [ ] Prototype lip-sync **on crop** then composite vs composite then lip-sync.

### Phase 1 — Orchestration (no new ML beyond existing)

- [ ] Shot flag `multiVideoComposite: boolean` + region metadata from mannequins.
- [ ] Generate N silent I2V jobs; store as layer assets in media library.
- [ ] Client-side or server-side RVM + alpha composite over static backdrop.
- [ ] Export single video; dialogue script → TTS → lip-sync per layer (sequential jobs).

### Phase 2 — Seam repair

- [ ] Seam mask generator (split line + feather).
- [ ] ProPainter (or fal equivalent) pass on composite output.
- [ ] Optional Aleph harmonize pass for lighting/shadow.

### Phase 3 — UX polish

- [ ] Split line overlay in Framing preview.
- [ ] Per-layer progress in generate panel (“Layer 1/2 I2V… Composite… Lip-sync A…”).
- [ ] Compare toggle: single I2V vs multi-composite take.

### Phase 4 — N characters + camera

- [ ] \>2 layers (depth order from mannequin `y` or explicit z-index).
- [ ] Shared animated background plate (camera-control model).
- [ ] Evaluate StM-class APIs if publicly available.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Lighting mismatch between layers | Color match on seam; Aleph harmonize; same bake lighting source |
| Scale / drift per layer I2V | Lock with baked T=0; short duration (4–6s); re-anchor each frame optional |
| RVM fails on non-human / toon | Mannequin mask propagation; manual mask touch-up (future) |
| Cost × N characters | Default off; warn “2× video gen + composite + lip-sync credits” |
| Temporal desync between layers | Shared seed/duration; single timeline; optional frame sync check |
| Split-screen aesthetic | Feather + inpaint; not hard 50/50 unless user wants it |

---

## Research sources

| Topic | Source |
|-------|--------|
| Split-then-Merge video composition | [arXiv:2511.20809](https://arxiv.org/html/2511.20809) — fg/bg video layers, inpainting holes, composer harmonization |
| ProPainter video inpainting | [Replicate jd7h/propainter](https://replicate.com/jd7h/propainter), ICCV 2023 |
| Robust Video Matting | [Replicate arielreplicate/robust_video_matting](https://replicate.com/arielreplicate/robust_video_matting) |
| Runway Aleph video edit | [Runway research](https://runwayml.com/research/introducing-runway-aleph), [Runware Aleph docs](https://runware.ai/docs/models/runway-aleph-2-0/guides/editing-video) |
| Wan 2.2 Animate Replace | [Replicate](https://replicate.com/wan-video/wan-2.2-animate-replace) — motion transfer, **not** two-clip merge |
| Replicate collections | [video-editing](https://replicate.com/collections/video-editing), [lipsync](https://replicate.com/collections/lipsync), [image-to-video](https://replicate.com/collections/image-to-video) |
| fal.ai | [image-to-video explore](https://fal.ai/explore?categories=image-to-video), [veed/lipsync](https://fal.ai/models/veed/lipsync), [wan animate replace](https://fal.ai/models/fal-ai/wan/v2.2-14b/animate/replace) |
| One action per character | `PROMPTS-FOR-VIDEO-GENERATION.md`, `APP-SHAPE.md` |

---

## Summary

**Multi-video compositing** is a Bake Start Frame sub-mode that uses mannequin regions to generate **isolated silent I2V layers**, merges them with **matting + seam inpainting** (ProPainter / optional Aleph), then finishes **per-character lip-sync on each layer before or after composite** (prefer **before** on single-character crops). It turns a model limitation into a orchestrated pipeline — the same philosophy as multi-pass bake identity, extended through time and audio.
