# VideoGen Tasks

## Wire shot breakdown & multi-reference across providers

**Status:** In progress (xAI first)

**Context:** Multi-reference video is **not** xAI-only. As of June 2026, Seedance 2.0, Kling 3, Veo 3.1, Wan 2.7, Hailuo 2.3, and Grok Imagine Video all support reference-conditioned generation via their own APIs or through [OpenRouter’s Video Generation API](https://openrouter.ai/docs/guides/overview/multimodal/video-generation). **VideoGen** only implements multi-ref end-to-end for **xAI** today; other adapters still use `pickImageInput()` (one image).

**Shot breakdown** (Subject / Backdrop / Style) and generic **Image 1–3** mode exist in the UI and prompt stack. This task wires those semantics to each provider — using each API’s native binding (prompt tags, `input_references`, frame keyframes, element tokens, etc.) — via first-party adapters and/or OpenRouter.

### Shared work (all providers)

- [ ] Branch off `pickImageInput()` when provider supports multi-ref
- [ ] Map Shot breakdown roles → provider fields + prompt text per card below
- [ ] Map generic slot mode → slot-indexed sends; reuse `@ImageN` where provider accepts it
- [ ] Update `provider-capabilities.ts` per provider (multi-ref limits, API vs prompt channel)
- [ ] README: clarify which providers get auto Subject/Backdrop text vs user-only binding

---

## OpenRouter — unified video API (recommended second path)

[OpenRouter](https://openrouter.ai/collections/video-models) hosts a **Video Generation** category (rankings updated June 2026) with async jobs, BYOK, and a normalized request shape across models.

| Item | Detail |
|------|--------|
| **Submit** | `POST https://openrouter.ai/api/v1/videos` |
| **Poll** | `GET https://openrouter.ai/api/v1/videos/{jobId}` |
| **Download** | `GET …/videos/{jobId}/content?index=0` or `unsigned_urls[0]` |
| **Discovery** | `GET /api/v1/videos/models` or `GET /api/v1/models?output_modalities=video` |
| **Docs** | [Video generation guide](https://openrouter.ai/docs/guides/overview/multimodal/video-generation) |

### OpenRouter image fields (critical for slot mapping)

| Field | Mode | Use in VideoGen |
|-------|------|-----------------|
| `frame_images[]` | **Image-to-video** — `frame_type`: `first_frame` or `last_frame` | Subject as `first_frame`; optional end frame; **takes precedence** if both image fields sent |
| `input_references[]` | **Reference-to-video** — style/content guidance, not locked first frame | Backdrop + Style slots; full **Shot breakdown** when 2+ refs |
| `generate_audio` | Native audio (default `true` where supported) | Pass from project/shot settings when we add audio toggle |

If both `frame_images` and `input_references` are sent, OpenRouter treats the request as **image-to-video** (`frame_images` wins). Adapter logic must choose mode explicitly.

### Hosted model slugs (June 2026)

| Model | OpenRouter slug |
|-------|-----------------|
| Grok Imagine Video | `x-ai/grok-imagine-video` |
| Kling 3.0 Standard | `kwaivgi/kling-v3.0-std` |
| Kling 3.0 Pro | `kwaivgi/kling-v3.0-pro` |
| Kling Video O1 | `kwaivgi/kling-video-o1` |
| Veo 3.1 Fast | `google/veo-3.1-fast` |
| Veo 3.1 Lite | `google/veo-3.1-lite` |
| Seedance 2.0 | `bytedance/seedance-2.0` |
| Seedance 2.0 Fast | `bytedance/seedance-2.0-fast` |
| Wan 2.7 | `alibaba/wan-2.7` |
| Hailuo 2.3 | `minimax/hailuo-2.3` |

**OpenRouter tasks:**

- [ ] Add `openrouter` built-in provider + connection test against `/api/v1/videos/models`
- [ ] Async job runner (submit → poll → return `videoUrl`)
- [ ] Map VideoGen slots → `frame_images` / `input_references` per model capabilities from `/videos/models`
- [ ] `provider.options` passthrough for model-specific params (`allowed_passthrough_parameters`)
- [ ] Webhook / `callback_url` support (optional)

---

## Google Veo — official access (parallel to OpenRouter)

| Path | Notes |
|------|--------|
| **Vertex AI** | Exclusive official enterprise provider; Veo 3.1 family (Generate, Fast, **Lite**), native audio, [Vertex video API](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/veo-video-generation) |
| **Gemini API** | Developer path via `generativelanguage.googleapis.com`; models e.g. `veo-3.1-generate-preview`, [Gemini video docs](https://ai.google.dev/gemini-api/docs/video) |

**Veo 3.1 capabilities (researched):**

- Text-to-video with **native synchronized audio**
- **Image-based direction:** up to **3 reference images** (Gemini API docs)
- **Frame-specific generation:** first and last frame conditioning
- Portrait `9:16` and landscape `16:9`
- Vertex tiers: **Veo 3.1**, **Veo 3.1 Fast**, **Veo 3.1 Lite** (high-volume / rapid iteration)

**Caveat:** Community reports of `referenceImages` availability varying by endpoint/model revision — verify against current Gemini/Vertex schema before shipping.

**Tasks:**

- [ ] `google-vertex` or `gemini` adapter (official BYOK)
- [ ] OpenRouter `google/veo-3.1-*` as alternate route (document tradeoffs)
- [ ] Map slots 1–3 → Veo reference images + prompt (no `<IMAGE_N>` unless API documents it)
- [ ] `generate_audio` / audio sync flags

---

### Provider cards

Ordered **xAI first** (in progress), then providers to wire up.

---

#### xAI — Grok Imagine Video

| | |
|---|---|
| **Status** | 🟡 Partial in VideoGen — multi-ref send + `<IMAGE_N>` auto-prefix; Shot breakdown toggle wired |
| **OpenRouter slug** | `x-ai/grok-imagine-video` |
| **Direct API** | `POST https://api.x.ai/v1/videos/generations` → poll `GET /v1/videos/{request_id}` |
| **Modes** | Text-to-video, image-to-video (`image`), reference-to-video (`reference_images`) |
| **Multi-ref limit** | Up to **7** reference images (OpenRouter); reference-to-video does **not** lock first frame |
| **Output** | 1–15 s, 24 fps, 480p / 720p; aspect ratios 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 |
| **Binding** | Prompt **`@Image1` / `<IMAGE_1>`** tags index into `reference_images` array — [reference-to-video docs](https://docs.x.ai/developers/model-capabilities/video/reference-to-video) |
| **VideoGen mapping** | Shot breakdown on → `augmentPromptForXAI` (Subject/Backdrop auto text); `@ImageN` skips auto-prefix. Slot 3 (Style) sent, not auto-described. |

**Remaining (xAI / VideoGen):**

- [ ] Slot order ↔ compacted API index when roles reordered
- [ ] Style slot: document `@Image3` pattern in README
- [ ] Quick-preview frame path alignment
- [ ] **Reference implementation** for other cards

---

#### ByteDance — Seedance 2.0 & Seedance 2.0 Fast

| | |
|---|---|
| **Status** | ⬜ Not wired in VideoGen |
| **OpenRouter slugs** | `bytedance/seedance-2.0`, `bytedance/seedance-2.0-fast` |
| **Direct API (fal)** | `bytedance/seedance-2.0/reference-to-video`, fast: `…/fast/reference-to-video` — [fal docs](https://fal.ai/models/bytedance/seedance-2.0/reference-to-video) |
| **Multi-ref limit** | **12 total inputs** across modalities: up to **9 images**, **3 videos**, **3 audio** (combined caps apply) |
| **Binding** | Prompt tokens **`@Image1`**, `@Video1`, `@Audio1`; fields `image_urls`, `video_urls`, `audio_urls` |
| **Output** | 4–15 s (or `auto`), 480p–1080p (Fast max **720p**), native audio (`generate_audio`, included in price) |
| **Strengths** | Character consistency, camera movement from refs, multimodal (image+video+audio) scenes |
| **VideoGen mapping** | Subject → `@Image1` + `image_urls[0]`; Backdrop → `@Image2`; Style → `@Image3` or separate style image. Generic mode: numbered `@ImageN` in prompt. Prefer **reference-to-video** path, not single first-frame. |

**Tasks:**

- [ ] OpenRouter + optional fal/BytePlus direct adapter
- [ ] Shot breakdown prompt builder using `@ImageN` (same mention syntax as xAI — expand `expandPromptMentions` per provider)
- [ ] Do not send video/audio slots until UI supports them; stay within 3 image slots for now

---

#### Kling — Kling 3.0 (Standard, Pro) & Video O1

| | |
|---|---|
| **Status** | ⬜ Not wired (`kling.ts` sends single `image` only) |
| **OpenRouter slugs** | `kwaivgi/kling-v3.0-std`, `kwaivgi/kling-v3.0-pro`, `kwaivgi/kling-video-o1` |
| **Direct API** | Kling developer API; fal **Kling O1** ([fal blog](https://blog.fal.ai/introducing-kling-o1-video-available-exclusively-as-an-api-on-fal/)); v3 **Elements** / `@ElementN` on newer endpoints |
| **OpenRouter (v3)** | Text-to-video + image-to-video; **first-frame and last-frame** control; 3–15 s; 16:9 / 9:16 / 1:1; optional **native audio** |
| **Kling O1** | 5 or 10 s clips; cinematic; first/last frame control |
| **Legacy Elements (v1.6)** | `input_image_urls` — up to 4 images, ordered — [fal Elements API](https://fal.ai/models/fal-ai/kling-video/v1.6/standard/elements/api) |
| **VideoGen mapping** | **OpenRouter:** Subject → `frame_images` `first_frame`; Backdrop/Style → `input_references` if model supports ref-to-video, else describe in prompt. **Kling API v3:** map to `elements` / `@Element1`… when using Omni/Elements endpoints. |

**Tasks:**

- [ ] Replace single-image `kling.ts` with mode-aware payload
- [ ] OpenRouter path for `kwaivgi/*` models
- [ ] `generate_audio` passthrough on v3 Standard/Pro
- [ ] Research Kling 3 Omni `@ElementN` vs OpenRouter `input_references` parity

---

#### Google — Veo 3.1 (Generate, Fast, Lite)

| | |
|---|---|
| **Status** | ⬜ Not wired |
| **OpenRouter slugs** | `google/veo-3.1-fast`, `google/veo-3.1-lite` (+ full tier when listed) |
| **Official** | Vertex AI + Gemini API (see [Google Veo section](#google-veo--official-access-parallel-to-openrouter)) |
| **Multi-ref** | Up to **3 reference images** (image-based direction); first/last frame; extension |
| **Audio** | Native synchronized audio (all three Vertex tiers per [Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/veo-3-1-lite-and-a-new-veo-upscaling-capability-on-vertex-ai)) |
| **Lite** | 720p/1080p, 4–8 s, 16:9 / 9:16 — optimized for volume and iteration |
| **VideoGen mapping** | Subject + Backdrop + Style → up to 3 refs via `input_references` (OpenRouter) or Gemini `referenceImages`; prose binding in prompt (no universal `<IMAGE_N>`). Use `frame_images` only when user wants locked first frame (i2v mode). |

**Tasks:**

- [ ] Vertex/Gemini first-party adapter
- [ ] OpenRouter secondary route with `provider.options.google-vertex` passthrough
- [ ] Shot breakdown: environment vs identity language in prompt (not xAI-style auto prefix unless verified)

---

#### Alibaba — Wan 2.7

| | |
|---|---|
| **Status** | ⬜ Not wired |
| **OpenRouter slug** | `alibaba/wan-2.7` |
| **Modes** | Text-to-video; image-to-video (first/last frame); **reference-to-video** (multiple refs guide style/content) |
| **Strengths** | Style transfer, reshoots, reference-guided scenes — [Wan 2.7 on fal](https://fal.ai/wan-2.7), Replicate `wan-2.7-videoedit` for edit/reshoot workflows |
| **VideoGen mapping** | **Style slot (3)** is the natural fit for Wan’s reference-to-video strength; Subject in slot 1; Backdrop in slot 2. OpenRouter: `input_references[]` for ref-to-video; `frame_images` for locked start frame. |

**Tasks:**

- [ ] OpenRouter `alibaba/wan-2.7` adapter branch
- [ ] Evaluate Wan video-edit / reshoot endpoints for “reshoot” studio action (future)
- [ ] Prompt templates emphasizing style transfer when Style slot filled

---

#### MiniMax — Hailuo 2.3

| | |
|---|---|
| **Status** | ⬜ Not wired (catalog stub only) |
| **OpenRouter slug** | `minimax/hailuo-2.3` |
| **Direct API** | `POST https://api.minimax.io/v1/video_generation` — async poll + file retrieve — [video guide](https://platform.minimax.io/docs/guides/video-generation) |
| **Model id** | `MiniMax-Hailuo-2.3` |
| **Modes** | (1) Text-to-video (2) Image-to-video via `first_frame_image` (3) First+last frame (4) **Subject-reference** via `subject_reference` + `S2V-01` (face consistency) |
| **Prompt extras** | Camera commands: `[Pan left]`, `[Push in]`, `[Static shot]`, etc. (up to 3 combined in `[]`) |
| **Output** | 6 or 10 s; 768P / 1080P for Hailuo 2.3 |
| **Multi-ref** | **Not** Seedance-style multi-image; primarily **one** driving image or subject face ref per job |
| **VideoGen mapping** | Subject → `first_frame_image` or `subject_reference`; Backdrop/Style → prompt description or OpenRouter `input_references` if supported on hosted route. Prioritize **single strongest ref** when API accepts only one image. |

**Tasks:**

- [ ] `minimax.ts` adapter (Hailuo 2.3 t2v / i2v / subject-reference modes)
- [ ] Map Shot breakdown to mode selection (Subject slot → i2v or S2V; Backdrop → prompt)
- [ ] Optional: fold camera-movement tokens from Motion panel into Hailuo `[command]` syntax

---

#### OpenRouter — implementation umbrella

| | |
|---|---|
| **Status** | ⬜ Not wired |
| **Role** | Single BYOK integration covering all slugs above |
| **Pricing** | Per-second SKUs via `pricing_skus` on `/videos/models` |
| **ZDR** | Video jobs **not** eligible for Zero Data Retention (async retention required) |

**Normalization layer (proposed):**

```
VideoGen slots (filled, in order)
  → if model supports reference-to-video: input_references[] + prompt (@ImageN / role prose)
  → else if Subject only: frame_images[{ first_frame }]
  → else: prompt-only + optional single pickImageInput fallback
```

- [ ] Implement normalization in `lib/studio/generation/adapters/openrouter.ts`
- [ ] Model capability cache from `GET /api/v1/videos/models`
- [ ] Unit tests: slot mapping for each slug in table above

---

### Related code (starting points)

| Area | Path |
|------|------|
| Single-image pick (branch/replace) | `lib/studio/generation/adapters/refs.server.ts` |
| xAI multi-ref + prefix | `lib/studio/generation/adapters/xai.ts`, `lib/studio/generation-prompt.ts` |
| Prompt / slot assembly | `lib/studio/model-payload.ts`, `lib/studio/prompt-mentions.ts` |
| Shot breakdown toggle | `lib/studio/reference-slots.ts`, `components/studio/ReferenceSlots.tsx` |
| Provider capability copy | `lib/studio/provider-capabilities.ts` |

### References (research, June 2026)

- [OpenRouter — Video generation](https://openrouter.ai/docs/guides/overview/multimodal/video-generation)
- [OpenRouter — Video models collection](https://openrouter.ai/collections/video-models)
- [xAI — Reference-to-video](https://docs.x.ai/developers/model-capabilities/video/reference-to-video)
- [fal — Seedance 2.0 reference-to-video](https://fal.ai/models/bytedance/seedance-2.0/reference-to-video)
- [Gemini API — Veo 3.1 video](https://ai.google.dev/gemini-api/docs/video)
- [Vertex AI — Veo 3.1 Lite announcement](https://cloud.google.com/blog/products/ai-machine-learning/veo-3-1-lite-and-a-new-veo-upscaling-capability-on-vertex-ai)
- [MiniMax — Video generation guide](https://platform.minimax.io/docs/guides/video-generation)
- [fal — Kling 1.6 Elements](https://fal.ai/models/fal-ai/kling-video/v1.6/standard/elements/api)