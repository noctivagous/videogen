# Model Catalog — Categories for Settings

Planning document for a **Settings → Models** tab (separate from API keys / default provider picks). Each category lists **what VideoGen needs**, which **workflow or pipeline stage** consumes it, implementation status, and **example models** on Replicate, fal.ai, or direct APIs.

Provider hubs today: **xAI**, **Replicate**, **fal.ai** (enabled in settings); plus planned direct adapters (**Google Gemini/Veo**, **Kling**, **Runway**, **Luma**, etc.).

Cross-reference: `video-generation-workflows.json` (workflow → capability), `lib/studio/workflow-capabilities.ts`, `APP-SHAPE.md`, `PROMPTS-FOR-VIDEO-GENERATION.md`.

---

## How categories relate to the app

```
Studio pipeline          Model category (this doc)        Settings slot
─────────────────────────────────────────────────────────────────────
Blocking preview         (none — PoseBlock GLB)           —
Image → mannequin pose   pose-estimation                  Default pose model
Theme / palette refs     image-edit / i2i                 Theme transform model
Preview still            text-to-image / i2i              Preview frame model
Character sheet app      text-to-image                    Character sheet model
Bake Pass 1              mask-inpaint OR image-edit       Bake Pass 1 model
Bake Pass 2              multi-image-identity-edit        Bake identity model
Generate video           i2v / t2v / ref-to-video         Default video model
Start & End Frame        first-last-frame                 (same or dedicated)
Motion workflow          motion-transfer                  Motion model
Lip-sync finish          lip-sync + tts                   Lip-sync + TTS models
Video cleanup            video-inpaint / video-edit       Edit model
```

**Capability ID** — stable string stored in project settings and matched by `workflow-capabilities.ts` (extend as needed).

**Native audio** — not a separate category; a **flag** on video models (`nativeAudio: none | prompt | voice-bound`). See `APP-SHAPE.md`.

---

## Category index

| # | Category ID | Label (Settings UI) | Primary stage |
|---|-------------|---------------------|---------------|
| 1 | `mask-inpaint` | Mask inpainting | Bake Pass 1 |
| 2 | `image-edit` | Image edit (no mask) | Bake Pass 1, theme transform |
| 3 | `multi-image-identity-edit` | Multi-image identity edit | Bake Pass 2 |
| 4 | `text-to-image` | Text-to-image | Preview still, character sheets |
| 5 | `image-to-image` | Image-to-image | Style / palette / upscale |
| 6 | `text-to-video` | Text-to-video | Pure B-roll, Auto-place (no still) |
| 7 | `image-to-video` | Image-to-video | Bake → video, Auto-place |
| 8 | `reference-to-video` | Reference-to-video (multi-ref) | Auto-place, Seedance-style |
| 9 | `first-last-frame` | First & last frame | Start & End Frame workflow |
| 10 | `video-extension` | Video extension | Continuation / extend clip |
| 11 | `camera-control` | Camera control | Camera Control workflow |
| 12 | `motion-transfer` | Motion transfer | Motion Transfer workflow |
| 13 | `multi-shot` | Multi-shot sequence | Multi-shot workflow |
| 14 | `video-edit` | Video-to-video edit | Re-style workflow |
| 15 | `video-inpaint` | Video inpaint | Video Inpaint workflow |
| 16 | `lip-sync` | Lip-sync | Re-style / Lip-sync, silent finish |
| 17 | `pose-estimation` | Image → humanoid pose | PoseBlock / mannequins |
| 18 | `control-reference` | Control references (depth/canny) | Future cinematography refs |
| 19 | `text-to-speech` | Text-to-speech | Lip-sync pipeline input |
| 20 | `speech-to-text` | Speech-to-text | Optional transcript / captions |
| 21 | `llm` | LLM / prompt assist | Shot breakdown, prompt expand |

---

## 1. Mask inpainting (`mask-inpaint`)

**Purpose:** Regenerate **masked regions only** (mannequin silhouettes) on a backdrop composite. Pixel-accurate; backdrop untouched.

**Used in:** Bake Start Frame **Pass 1** (preferred over maskless edit).

**Workflow capability:** `inpaint`

**Status:** Implemented — `lib/studio/generation/adapters/inpaint.ts` (Replicate FLUX Fill).

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Replicate | `black-forest-labs/flux-fill-pro` | Default in `lib/constants/workflows.ts` |
| fal.ai | `fal-ai/flux-pro/v1/fill` | Same FLUX Fill family |
| fal.ai | `fal-ai/flux-lora/inpainting` | LoRA + mask |
| fal.ai | `fal-ai/flux-general/inpainting` | ControlNet / IP-Adapter extensions |
| Runware / others | Various FLUX Fill endpoints | Same API shape: image + mask + prompt |

**Settings fields:** provider, model ID, default prompt snippet (optional override).

---

## 2. Image edit — no mask (`image-edit`)

**Purpose:** Edit a full image or composite via prompt when **no mask API** exists — e.g. replace gray mannequin silhouettes visible in the composite.

**Used in:** Bake Pass 1 fallback; **Theme Transformer** (color grade / look on reference slots); preview-frame on some providers.

**Workflow capability:** `image-edit`

**Status:** Implemented — xAI image edit in `inpaint.ts`; preview in `preview-frame.ts`.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| xAI | `grok-imagine-image-quality` | Default bake Pass 1 when inpaint unavailable |
| OpenAI | GPT image / edit endpoints | `preview-frame.ts` |
| fal.ai | `fal-ai/flux-kontext-lora` (edit) | Semantic edit, no mask |
| Replicate | Various `*-edit` models | Provider-specific |

---

## 3. Multi-image identity edit (`multi-image-identity-edit`)

**Purpose:** Apply **character sheet identity** onto an already-composed scene without changing pose, framing, or backdrop.

**Used in:** Bake **Pass 2** (`identityPasses[]` in `inpaint-types.ts`).

**Workflow capability:** `image-edit` + multi-ref (no separate key today — add `identity-edit`).

**Status:** Implemented — xAI multi-image edit; Kontext inpaint with `reference_image_url` planned.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| xAI | `grok-imagine-image-*` | Up to 3 images; `<IMAGE_0>` scene + sheets |
| fal.ai | `fal-ai/flux-kontext-lora/inpaint` | reference + mask per figure |
| Replicate | IP-Adapter / character consistency models | Often weaker for multi-person |

**Settings:** max refs per pass, sequential pass strategy for 3+ characters.

---

## 4. Text-to-image (`text-to-image`)

**Purpose:** Generate stills from text — blocking preview, character sheet generator, stock assets, empty-shot placeholders.

**Used in:** Preview panel, Character Sheet Generator app, future image studio.

**Workflow capability:** (none — image modality)

**Status:** Partial — preview-frame builder; character sheet UI exists.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| xAI | `grok-imagine-image-*` | |
| Replicate | `black-forest-labs/flux-1.1-pro`, `google/imagen-*` | Large catalog |
| fal.ai | `fal-ai/flux-pro/v1.1`, `fal-ai/flux/dev` | |
| OpenAI | `gpt-image-*` | |

---

## 5. Image-to-image (`image-to-image`)

**Purpose:** Transform an existing image — style, color grade, light retouch — while preserving structure.

**Used in:** Theme Transformer (`theme-transform.ts`), character sheet variants, upscaling.

**Workflow capability:** `image-edit` (overlap with #2)

**Status:** Partial — theme transform prompts; no dedicated i2i picker.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| fal.ai | FLUX Kontext, Redux | Style / subject preservation |
| Replicate | `flux-kontext`, style transfer models | |
| Stability | SD img2img | |

---

## 6. Text-to-video (`text-to-video`)

**Purpose:** Video from prompt alone — no start frame. B-roll, establishing shots, exploratory dialogue (native audio on some models).

**Used in:** Pure B-roll workflow; fallback when no baked frame.

**Workflow capability:** `t2v`

**Status:** Adapters exist (Kling, Runway, Luma, Replicate, xAI limited); Grok 1.5 is **I2V-only**.

| Provider | Example model ID | Native audio |
|----------|------------------|--------------|
| Google | `veo-3.1-generate-preview` | Yes |
| Replicate | `bytedance/seedance-2.0`, `google/veo-3.1` | Seedance, Veo |
| fal.ai | Veo 3.1, Kling 3, Wan | Many |
| Kling | `kling-v3`, `kling-v3-omni` | Omni yes |
| Runway | Gen-4 | Varies |
| Luma | Ray 2 | |
| Replicate | `wan-video/wan-2.5-t2v-fast` | WAN collection |

---

## 7. Image-to-video (`image-to-video`)

**Purpose:** Animate a **single start frame** (usually baked) with motion prompt. Core VideoGen output path.

**Used in:** Bake Start Frame → Generate; Auto-place (sheet + backdrop as refs on some providers).

**Workflow capability:** `i2v`

**Status:** Implemented — xAI `grok-imagine-video-1.5` default.

| Provider | Example model ID | Native audio | Max refs |
|----------|------------------|--------------|----------|
| xAI | `grok-imagine-video-1.5` | Yes | 1 (I2V only) |
| Google | Veo 3.1 I2V | Yes | 1 + up to 3 asset refs |
| Kling | 2.x / 3.x I2V | 3.0 Omni | |
| Runway | Gen-4 I2V | | |
| Luma | Ray 2 | | |
| Replicate | Kling, Minimax, Hailuo collections | | |
| fal.ai | `image-to-video` explore category | | |

---

## 8. Reference-to-video (`reference-to-video`)

**Purpose:** Multiple images/videos/audio as **ingredients** — character + backdrop + motion ref + audio ref in one prompt (not just one start pixel).

**Used in:** Auto-place Character (advanced); Seedance-style workflows; future multi-ref UI (7 slots).

**Workflow capability:** Extend `i2v` or add `reference-to-video`.

**Status:** Not wired; xAI ref-to-video exists on older Grok; Seedance 2 is the reference implementation.

| Provider | Example model ID | Ref limits |
|----------|------------------|------------|
| ByteDance | `seedance-2.0` | 9 img + 3 vid + 3 audio |
| xAI | Grok Imagine (legacy ref modes) | Varies |
| PixAI | V4.0 Preview | 6 img + 3 vid + 3 audio |
| Kling | Elements 3.0 | Character + voice binding |

**Prompt syntax:** `[Image1]`, `@image1`, `<IMAGE_N>` — compiler normalizes per provider.

---

## 9. First & last frame (`first-last-frame`)

**Purpose:** Interpolate between two stills — product reveal, logo land, controlled open/close.

**Used in:** Start & End Frame workflow (`video-generation-workflows.json`).

**Workflow capability:** `first-last-frame`

**Status:** Workflow defined; not fully implemented.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Google | Veo 3.1 | `image` + `lastFrame` in Gemini API |
| Kling | 3.0+ | |
| Runway | Gen-4 | |
| Seedance 2 | I2V with first + last image | |

---

## 10. Video extension (`video-extension`)

**Purpose:** Continue an existing clip — same characters, next story beat.

**Used in:** Media library “extend”; Veo extension API.

**Workflow capability:** Add `video-extension` (related to `video-edit`).

**Status:** Not implemented.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Google | Veo 3.1 | `video` input + prompt; voice tricky on extend |
| Seedance 2 | Reference video + prompt | |
| Grok 1.5 | Video extension (consumer) | Check API availability |

---

## 11. Camera control (`camera-control`)

**Purpose:** Camera moves on static or lightly animated scene — crane, dolly, orbit — **not** character performance.

**Used in:** Camera Control workflow.

**Workflow capability:** `camera-control`

**Status:** Workflow defined; prompt-only today via camera constants.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Runway | Gen-4 camera modes | |
| Kling | 3.0 | |
| Veo | 3.1 | |
| Luma | Ray 2 | |
| PixAI | V2.7 High Dynamics | Camera dropdown |

---

## 12. Motion transfer (`motion-transfer`)

**Purpose:** Drive a character with **reference video** motion (dance, walk cycle, performance).

**Used in:** Motion Transfer / Performance workflow.

**Workflow capability:** `motion-transfer`

**Status:** Workflow defined; not implemented.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Kling | Motion Control | |
| Runway | Act-One | |
| Replicate / fal | Wan Animate, Viggle-style | `wan2.2-animate` etc. |
| MuAPI / others | Video-to-video character replace | |

---

## 13. Multi-shot (`multi-shot`)

**Purpose:** One prompt → 3–6 connected shots (shot/reverse-shot, dialogue coverage).

**Used in:** Multi-shot Sequence workflow.

**Workflow capability:** `multi-shot`

**Status:** Workflow defined; requires Kling 3.0+.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Kling | 3.0 / 3.0 Omni | AI Director, native dialogue |
| Seedance 2 | Multi-beat prompts | Less native shot list |

---

## 14. Video-to-video edit (`video-edit`)

**Purpose:** Restyle or alter existing footage with text — change wardrobe, background, grade.

**Used in:** Re-style / Lip-sync workflow (style path).

**Workflow capability:** `video-edit`

**Status:** Not implemented.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Runway | Aleph / Gen-4 edit | |
| Replicate | `wan-video/wan-2.7-videoedit` | video-editing collection |
| Kling | Video edit modes | |

---

## 15. Video inpaint (`video-inpaint`)

**Purpose:** Mask objects in **video**; fill with temporally consistent background.

**Used in:** Video Inpaint / Object Removal workflow.

**Workflow capability:** `video-inpaint`

**Status:** Not implemented.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Runway | Aleph inpaint | |
| Pika | fal.ai Pika inpaint | |
| Kling | Object removal | |

---

## 16. Lip-sync (`lip-sync`)

**Purpose:** **Silent video + audio** → mouth synced to exact words (Tier C in `APP-SHAPE.md`).

**Used in:** Re-style / Lip-sync workflow; silent audio mode finish step.

**Workflow capability:** `lipsync`

**Status:** Kling Lip Sync listed in adapter; not wired in studio UI.

| Provider | Example model ID | Input |
|----------|------------------|-------|
| Kling | `kling-lip-sync` | Video + audio |
| Replicate | `lipsync` collection — Wav2Lip, SadTalker, LivePortrait | |
| fal.ai | `veed/lipsync`, MultiTalk, HeyGen Avatar | |
| sync.labs / HeyGen | External APIs | Post-production |

**Pair with:** `text-to-speech` (#19) for script → audio → lip-sync.

---

## 17. Pose estimation (`pose-estimation`)

**Purpose:** **Photo → humanoid pose** for PoseBlock mannequins (SMPL → Mixamo retarget).

**Used in:** PoseBlock “Match backdrop” / drop image; `TASKS-IMAGE-TO-POSE.md`.

**Workflow capability:** New — `pose-estimation` (not in workflows JSON yet).

**Status:** Spec only; fal 4D-Humans planned.

| Provider | Example model ID | Output |
|----------|------------------|--------|
| fal.ai | `fal-ai/4d-humans` / HMR 2.0 | `smpl_pose` 72 floats |
| Browser (optional) | MediaPipe Pose | 2D landmarks → weaker retarget |
| Replicate | OpenPose / DWPose detectors | Usually for ControlNet, not full retarget |

**Not the same as:** motion transfer (#12) — pose estimation sets **static** mannequin pose from one photo.

---

## 18. Control references (`control-reference`)

**Purpose:** Depth maps, Canny edges, OpenPose skeletons as **video/image conditioning** (ReferenceRole `Depth`, `Canny` in types).

**Used in:** Future cinematography ref slots; some video models accept control video.

**Workflow capability:** Add `control-reference` when wired.

**Status:** Slot roles exist in UI types; generation not wired.

| Provider | Example | Notes |
|----------|---------|-------|
| Replicate | Depth Anything, Canny preprocessors | Often paired with I2V |
| fal.ai | ControlNet stacks on FLUX / Wan | |
| Runway | Motion brush / control layers | |

---

## 19. Text-to-speech (`text-to-speech`)

**Purpose:** Script lines → audio file for lip-sync pipeline.

**Used in:** Silent mode finish; Character Performance dialogue export.

**Workflow capability:** Modality `tts` in `provider-modalities.ts`.

**Status:** Modality recognized; no studio wiring.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Replicate | ElevenLabs, Bark, Kokoro | `tts` collection |
| fal.ai | Various TTS endpoints | |
| OpenAI | TTS API | |
| Kling | Voice from Elements (bound) | Tier B — not file export |

---

## 20. Speech-to-text (`speech-to-text`)

**Purpose:** Transcribe generated or uploaded audio — captions, script verification.

**Used in:** Optional utility; media library metadata.

**Workflow capability:** Modality `tts` (STT grouped today) or split `stt`.

**Status:** Not implemented.

| Provider | Example model ID | Notes |
|----------|------------------|-------|
| Replicate | Whisper, faster-whisper | |
| OpenAI | Whisper API | |

---

## 21. LLM (`llm`)

**Purpose:** Prompt expansion, shot breakdown, checklist copy, xAI docs MCP — **not** pixel generation.

**Used in:** Future shot breakdown modal; prompt helpers (`FUTURE-FEATURES.md`).

**Workflow capability:** N/A

**Status:** Modality in provider list; Grok/chat providers grayed out.

| Provider | Example | Notes |
|----------|---------|-------|
| xAI | Grok | |
| OpenAI | GPT-4o | |
| Google | Gemini | |

---

## Replicate & fal.ai — collection map

Use these marketplace **collections** when browsing for models to slot into categories above.

### Replicate ([collections](https://replicate.com/collections))

| Collection | Maps to category |
|------------|------------------|
| [text-to-video](https://replicate.com/collections/text-to-video) | `text-to-video`, `reference-to-video` |
| [image-to-video](https://replicate.com/collections/image-to-video) | `image-to-video`, `first-last-frame` |
| [video-editing](https://replicate.com/collections/video-editing) | `video-edit`, `video-inpaint` |
| [lipsync](https://replicate.com/collections/lipsync) | `lip-sync` |
| [official](https://replicate.com/collections/official) | FLUX, Kling, Seedance, etc. |
| wan-video | `text-to-video`, `image-to-video`, `video-edit` |

### fal.ai ([explore](https://fal.ai/explore/models))

| Explore filter | Maps to category |
|----------------|------------------|
| Image to Video | `image-to-video` |
| Text to Video | `text-to-video` |
| Image to Image / Kontext | `image-edit`, `image-to-image`, `multi-image-identity-edit` |
| Inpainting / FLUX Fill | `mask-inpaint` |
| Lip sync / avatar | `lip-sync` |
| 4D-Humans / pose | `pose-estimation` |

---

## Settings → Models tab (proposed UX)

Separate tab from **Providers & API keys** (connection) vs **Models** (which endpoint per job).

### Layout

```
Settings
├── Providers          (API keys, test connection, default video/image provider)
└── Models             ← this catalog
    ├── Bake
    │   ├── Pass 1: Inpaint model     [Replicate ▾ flux-fill-pro]
    │   └── Pass 2: Identity model    [xAI ▾ grok-imagine-image-quality]
    ├── Video generation
    │   ├── Draft (I2V)               [xAI ▾ grok-imagine-video-1.5]
    │   ├── Final (optional)          [Google ▾ veo-3.1]
    │   └── Native audio default      [Silent ▾ | Native | Script only]
    ├── Finish
    │   ├── Lip-sync                  [Kling ▾ kling-lip-sync]
    │   └── Text-to-speech            [Replicate ▾ elevenlabs]
    ├── Still image
    │   ├── Preview frame             [xAI ▾ …]
    │   └── Character sheet           [fal ▾ …]
    ├── Pose
    │   └── Image → mannequin         [fal ▾ 4d-humans]
    └── Advanced workflows (collapsed)
        ├── Motion transfer
        ├── First/last frame
        ├── Multi-shot
        ├── Video inpaint
        └── Video edit
```

### Per-model row (data model sketch)

```typescript
interface ModelSlotConfig {
  categoryId: string;           // e.g. 'mask-inpaint'
  providerId: string;           // 'replicate' | 'fal' | 'xai' | …
  modelId: string;              // provider-native slug
  label?: string;               // display override
  nativeAudio?: 'none' | 'prompt' | 'voice-bound';
  maxRefs?: number;
  notes?: string;               // user/admin notes
  status: 'implemented' | 'planned' | 'experimental';
}
```

Store in `AIState` or `project.settings.modelSlots` — keyed by **category**, not by provider brand.

### Discovery

- **Replicate / fal:** On provider test, merge discovered models into category suggestions (filter by collection keywords).
- **Curated defaults:** Ship a `model-catalog.defaults.json` with one recommended model per category per enabled provider.
- **Workflow guardrails:** `getWorkflowModelAvailability` checks category slots, not just “any video provider configured.”

---

## Implementation status summary

| Category | Status | Key files |
|----------|--------|-----------|
| mask-inpaint | ✅ | `inpaint.ts`, `bake-start-frame/route.ts` |
| image-edit | ✅ | `inpaint.ts`, `preview-frame.ts`, `theme-transform.ts` |
| multi-image-identity-edit | ✅ partial | `bake-identity-pass.ts`, xAI only |
| image-to-video | ✅ | `xai.ts` (Grok 1.5) |
| text-to-video | 🔶 adapters | `kling.ts`, `runway.ts`, … |
| lip-sync | 🔶 adapter stub | `kling.ts` (`kling-lip-sync`) |
| pose-estimation | 📋 spec | `TASKS-IMAGE-TO-POSE.md` |
| reference-to-video | 📋 | — |
| first-last-frame | 📋 workflow | `video-generation-workflows.json` |
| motion-transfer | 📋 workflow | — |
| multi-shot | 📋 workflow | — |
| video-inpaint / video-edit | 📋 workflow | — |
| text-to-speech | 📋 modality only | `provider-modalities.ts` |
| control-reference | 📋 roles in types | `ReferenceRole` Depth/Canny |

Legend: ✅ wired · 🔶 partial · 📋 planned

---

## Related documentation

- `APP-SHAPE.md` — audio modes, provider roles, silent vs native
- `PROMPTS-FOR-VIDEO-GENERATION.md` — how categories compile to prompts
- `MANNEQUINS-BAKE-START-FRAME.md` — bake Pass 1 / Pass 2 detail
- `TASKS-IMAGE-TO-POSE.md` — pose-estimation implementation plan
- `video-generation-workflows.json` — workflow → capability mapping
