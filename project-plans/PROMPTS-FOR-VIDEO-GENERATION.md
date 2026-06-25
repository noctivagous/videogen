# Writing Prompts for AI Video Generation

Writing effective prompts for AI video generation involving multiple characters requires a shift from creative writing to **structured directive prompting**. Current models do not inherently understand complex social dynamics or script formats; they rely on spatial and descriptive isolation to distinguish between subjects.

VideoGen separates prompt concerns across stages:

1. **Bake Start Frame** — produce a locked still (first video frame) from backdrop + mannequin blocking + character sheets.
2. **Video generation** — animate from that still (or from separate references in Auto-place workflows).
3. **Audio finish** — how dialogue becomes sound, depending on **audio mode** and provider:
   - **Silent** — performance proxies in the video prompt; optional lip-sync post-production (Tier C).
   - **Native** — quoted dialogue compiled into the video prompt for models that generate speech in one pass (Tier A/B).
   - **Script only** — no speech in video gen; export script for lip-sync / TTS.

See `APP-SHAPE.md` for product architecture (silent-first defaults, UI controls, provider roles).

This document covers how to write and translate prompts for all stages, including the planned **per-character performance** fields (dialogue, action, expression) in the studio bottom bar.

---

## Structuring Multi-Character Prompts

To manage multiple characters, explicitly isolate each subject within the prompt syntax. The most effective method is a **Subject + Action** pairing for each character, separated by punctuation or distinct clauses.

Instead of:

> Two people talking.

Write:

> A woman in a red jacket raises her eyebrow; a man in a blue suit nods slowly.

This **compartmentalization** helps the diffusion model process motion vectors for each entity independently, reducing "morphing" where features blend between characters.

### Spatial locking

Always tie each character clause to a **screen position**, not just a name:

- "The **leftmost** figure gestures with one hand…"
- "The **rightmost** figure listens, head tilted slightly…"
- "The **center** figure steps forward…"

Positional cues (`left`, `right`, `leftmost`, `rightmost`, `center`) help the model assign the correct attributes to the correct person. Without them, features tend to blend between subjects — especially in multi-character bakes and video prompts.

VideoGen derives spatial labels from mannequin blocking (`leftmost`, `rightmost`, `center`, `sole`). Per-character performance text should compile into those anchors.

### One action per character

Current models struggle with simultaneous, distinct complex actions. If Character A is dancing and Character B is cooking, the model may blend these motions. Prefer:

- One primary action per character per prompt.
- Low-complexity shared interactions ("both turn toward the door") over choreographed multi-beat scenes.
- Separate clips + compositing for complex simultaneous performances.

---

## Referencing Characters: Names, Text Anchors, and Images

### Text-to-video: names are not enough

**Names alone are insufficient** for maintaining character identity in text-to-video models. Unless you have trained a custom model (LoRA, etc.) on a specific character named "John," the AI has no concept of who "John" is.

You must use **consistent visual anchors** every time you mention a character. If Character A is "a cyclist with a yellow helmet," repeat that exact phrase (or a very close variation) in every prompt where they appear. Changing it to "the biker" can cause the model to generate a different person.

### Image-to-video and reference workflows: the image is the anchor

When identity comes from a **character sheet**, **baked start frame**, or other reference image, the rules change:

> **The image is the identity anchor; text describes motion and performance, not appearance.**

Research and provider guidance (PixAI, Magic Hour, Vidu, Runway I2V docs) converge on this pattern:

- You do **not** need long visual re-descriptions of face, hair, and wardrobe when the reference image already encodes them.
- You **should** still include light subject anchors and **spatial labels** during video generation — especially with multiple characters — to prevent drift during motion.
- The baked frame (or character sheet in Auto-place workflows) carries identity; the video prompt carries **what changes over time**.

| Workflow | Identity source | Text prompt role |
|----------|-----------------|------------------|
| Text-to-video | None | Full visual anchors + action |
| Auto-place Character | Character sheet `<IMAGE_N>` + backdrop | Spatial Subject+Action; reference binding line |
| Bake Start Frame (video) | Locked baked pixels | Motion and expression change only; no scene rebuild |
| Bake Start Frame (bake) | Character sheets applied in identity pass | Placement integration + optional opening expression |

### Image reference binding

For high consistency, **image-to-video** workflows are superior. Advanced platforms allow **multiple reference images** or anchor frames for different characters. In those cases:

- The **image** acts as identity and composition.
- The **text prompt** strictly dictates motion, interaction, and (where supported) performance.

VideoGen uses explicit reference binding in prompts (`<IMAGE_1>`, `<IMAGE_2>`, …) when the provider API requires it (e.g. xAI). Other providers may receive the same images via API fields with simpler text prompts — the binding logic lives in the app, not necessarily in user-visible prompt text.

---

## Audio Modes and Three Tiers of Speech

How dialogue is compiled depends on **shot audio mode** and **provider capabilities** — not a single global rule.

### Three tiers

| Tier | Mechanism | Examples | Control over exact words |
|------|-----------|----------|--------------------------|
| **A. Native generative audio** | Model generates voice + mouth motion from prompt text in one pass | Grok Imagine Video 1.5, Veo 3.1, Seedance 2, PixAI V3.2/V4 | Approximate — good for creative beats, not broadcast scripts |
| **B. Native audio + voice binding** | Pre-registered character voice; lines assigned with syntax | Kling 3.0 Omni (`<<<voice_1>>>`) | Better consistency across shots; still generative |
| **C. Post-production lip-sync** | Silent video + separate audio file (recorded or TTS) | Kling Lip Sync, HeyGen, sync.labs | Word-perfect — audio drives the mouth |

**Silent-first is the default for Bake Start Frame** (baked pixels are the contract; exact scripts favor Tier C). **Native audio is a first-class optional path** when the provider supports it — not hidden, not universal.

### Shot audio modes

| Mode | Video prompt | Dialogue field | After generate |
|------|--------------|----------------|----------------|
| **Silent** (default for bake) | Visual speech proxies | Stored as script | Optional lip-sync export |
| **Native** | Quoted lines (provider syntax) | Compiled into prompt | Re-gen / mute if audio wrong |
| **Script only** | No speech cues | Stored as script | Lip-sync / TTS only |

Default by workflow:

| Workflow | Default audio mode |
|----------|-------------------|
| Bake Start Frame | Silent |
| Auto-place Character | Native (if provider supports) |
| Pure B-roll | Ambient / SFX only |
| Multi-shot dialogue | Native (e.g. Kling Omni) |

---

## Per-Character Performance: Dialogue, Action, and Expression

VideoGen will expose per-character fields (one card per character assigned in the Subjects checklist): **Dialogue**, **Action**, and **Expression**. These are **authoring fields** — the user writes naturally; the app **compiles** them based on audio mode and provider.

| Field | Always stored | Bake | Silent video prompt | Native video prompt |
|-------|---------------|------|---------------------|---------------------|
| **Expression** | ✓ | Opening state (optional) | Change over time | Same + delivery |
| **Action** | ✓ | — | Physical motion | Same |
| **Dialogue** | ✓ | Never | Visual proxies only | Quoted lines (provider syntax) |

Dialogue is always **script** in the data model — even in silent mode — so lip-sync export never loses the lines.

### Dialogue

There is a critical distinction between **visual action** and **speech** — but the answer depends on tier and audio mode, not on a single "models can't do dialogue" rule.

#### Silent mode (Tier C path)

Models without native audio (Runway, Wan, older I2V, FLUX inpaint pipelines) **cannot** produce synced speech from quoted lines. Quoted dialogue in the prompt is ignored or read as vague "talking."

**Do (silent video prompt):**

> The leftmost figure gestures with her hand while moving lips as if speaking; the rightmost figure listens intently.

**Don't (silent video prompt):**

> The woman says "Hello there" and the man replies "Hi."

For **exact scripts**, generate silent video with performance proxies, then apply **lip-sync** with a separate audio file or TTS. The video prompt focuses on **body language and facial expressions** accompanying the speech.

#### Native mode (Tier A/B path)

Native-audio models generate speech, SFX, and ambience in the **same pass** as video. Quoted dialogue in the prompt **can** produce audible speech with approximate lip sync.

| Provider | Dialogue syntax (examples) |
|----------|---------------------------|
| **Grok Imagine Video 1.5** | Quotes in prompt; optional `AUDIO:` section — e.g. `a quiet whisper: "We made it."` |
| **Veo 3.1** | Quotes + speaker labels — e.g. `Man: "That's no ordinary bear." Woman: "Then what is it?"` |
| **Seedance 2** | Double quotes — e.g. `The man stopped and said: "Remember this moment."` |
| **Kling 3.0 Omni** | Voice tags + quotes — e.g. `The man <<<voice_1>>> said, "Hello."` (requires Element/voice binding) |
| **PixAI V3.2/V4** | Spoken lines in prompt when **Add Audio** is ON; write in target language |

**Caveats for native dialogue:**

- **Generative, not teleprompter-accurate** — words may drift; voice is invented unless voice-bound (Kling Elements).
- **Image-to-video + speech** is less reliable than text-to-video for lip-sync on some models; multi-character dialogue remains hard.
- **Audio is not guaranteed every generation** — some clips return music-only or silent; plan for re-roll or mute/replace.
- **Never in bake** — dialogue is temporal; bake is a still.

**Dialogue field behavior in VideoGen (compiler):**

- Always stored as **script metadata** (lip-sync export, future TTS).
- **Never** injected into bake prompts.
- **Silent mode:** compile to visual speech proxies; enable lip-sync export.
- **Native mode:** compile to provider-specific quoted syntax when `nativeAudio` capability is `'prompt'` or `'voice-bound'`.

### Action

**Action** describes body movement over time. It belongs in the **video prompt**, not the bake.

- Compile per character with spatial label: "The leftmost figure steps forward and extends one hand."
- Bake preserves mannequin pose as T=0; video action describes how subjects **move away from** that pose.
- Do not describe actions that contradict the locked baked composition (reframe, reposition, recrop).

### Expression

**Expression** splits by time:

| Timing | Target | Rationale |
|--------|--------|-----------|
| **Opening / T=0** | **Bake** (optional) | The baked frame *is* the first video frame. A neutral identity pass may fight an opening beat ("concerned," "tearful," "suppressed smile"). |
| **Change over time** | **Video prompt** | "Expression softens," "brows furrow," "breaks into a smile" — motion-layer language. |
| **During speech** | **Video prompt** | Silent mode: "jaw set," "eyes narrow while speaking" (visual proxy). Native mode: delivery adverbs alongside quoted dialogue. |

**Expression in bake:**

- Include **opening expression only** when the first frame must show a specific emotional state.
- **Never** include dialogue in bake prompts.
- **Never** include body action in bake prompts (bake is a still; mannequins define pose).

**Compiled bake example (2 characters, opening expression):**

> The leftmost figure has a concerned expression, jaw set. The rightmost figure has a neutral expression, relaxed mouth.

**Compiled video example — silent mode:**

> The leftmost figure gestures with one hand while moving lips as if speaking; expression concerned, jaw set. The rightmost figure stands still, listening intently; expression neutral, slight head tilt.

**Compiled video example — native mode (Grok 1.5 / Veo-style):**

> The leftmost figure gestures with one hand; expression concerned. She says urgently: "We need to leave. Now." The rightmost figure stands still, listening intently; expression neutral.

### Scene Setup vs. Shot Activity vs. Character Performance

| Field | Scope |
|-------|--------|
| **Scene Setup** | Environment, props, mood, non-character staging |
| **Shot Activity** | Ensemble beats, camera-relative action, shared motion |
| **Character Performance** | Per-character expression, action, dialogue (authored) → compiled into prompt fragments |

Avoid duplication: if a character's action is specified in the performance column, the compiler should not repeat it from global Shot Activity.

When a **baked start frame** is ready for video, Scene Setup and camera/lighting prompt rows are suppressed — only Shot Activity (plus compiled character performance) and atmosphere preservation are sent. Identity is already in the pixels.

---

## Bake Start Frame: Provider-Agnostic Prompting

The Bake Start Frame workflow produces a **locked first frame** before video generation. Mannequins define *where and how* subjects sit in the frame; baking turns gray silhouettes into photorealistic characters on the backdrop.

VideoGen uses a **two-pass design** that is **not tied to xAI**. Pass 1 and Pass 2 can run on different providers (Replicate, fal.ai, xAI, OpenAI, custom endpoints) depending on model availability and API shape.

### Pass 1 — Scene integration (silhouette → person)

**Goal:** Put believable human(s) in the correct pose, scale, and lighting on the backdrop.

| Provider style | Mechanism | Prompt focus |
|----------------|-----------|--------------|
| **Mask inpainting** (Replicate FLUX Fill, fal.ai FLUX Fill, Runware, etc.) | Source image + **mask** (white = mannequin regions) + prompt | Generic person integration — *not* character identity |
| **Image edit** (xAI, some Kontext/Fill variants with reference) | Composite image (backdrop + visible silhouettes) + prompt | Replace silhouettes with photorealistic people in place |

**Pass 1 prompt principles:**

- Describe **integration with the scene**, not a specific named character.
- Match backdrop lighting, shadows, ground contact, and scale.
- Do not reference character sheets — placement comes from mannequins, not sheets.
- Multi-mannequin scenes: one Pass 1 call replaces **all** silhouettes; spatial placement is implicit (left mannequin → left person).

Example (mask inpainting):

> Photorealistic person standing in relaxed pose, seamless integration with backdrop lighting and shadows, natural skin tones, no text or watermarks.

Example (image edit):

> Replace every gray mannequin silhouette with a photorealistic person in the exact same pose, position, and scale. Seamless integration with the backdrop lighting and shadows. Remove all gray mannequin figures completely.

**Mask inpainting vs. image edit:**

- **Inpainting** (FLUX Fill on Replicate/fal.ai): pixel-accurate mask confines changes to mannequin shapes; backdrop is never touched. Preferred when a mask API is available.
- **Image edit** (xAI, Kontext-style): no mask — model must infer silhouette regions from the composite. Same goal, less precise spatial control.

Both are valid Pass 1 backends. The app selects the provider; prompt semantics stay the same.

### Pass 2 — Identity transfer (optional)

**Goal:** Make the person(s) from Pass 1 look like **your** character(s) from character sheet(s), without changing composition.

Pass 2 runs when character sheets are assigned to mannequins. It is a **separate concern** from Pass 1:

| Pass | Question |
|------|----------|
| Pass 1 | "Put a believable human here, matching this backdrop." |
| Pass 2 | "Keep this composition — apply face, body, wardrobe from the character reference." |

**Pass 2 prompt principles:**

- **Preserve** scene composition, pose, facing, scale, and backdrop from the baked scene image.
- **Transfer** face, skin, hair, body build, and wardrobe from the character sheet.
- **Ignore** background, pose, and composition in character sheet images.
- Use **spatial labels** per figure: "Apply identity from `<IMAGE_1>` onto the leftmost figure in `<IMAGE_0>`."
- With multiple characters: one character sheet per principal; do not use a single "cast sheet" with tiny faces — trait mixing and left/right ambiguity result.

**Provider constraints vary:**

- Some APIs cap images per request (e.g. xAI: 3 images). A 3-person cast may require **sequential** identity passes (apply character A, then B, then C on the intermediate result).
- **Kontext-style inpainting** (fal.ai Flux Kontext LoRA inpaint) supports `reference_image_url` + mask — identity can be applied to a masked figure region in one call.
- **Plain FLUX Fill inpainting** has no built-in reference-image slot; identity transfer requires a multi-image edit endpoint or a follow-up pass with a reference-capable model.

The app abstracts these into `identityPasses[]` — each pass carries its own provider, refs, and compiled prompt. Prompt *semantics* are stable; *packaging* differs by provider.

**Opening expression in Pass 2:**

When the user sets a non-neutral **opening expression**, append it to the identity pass prompt for that figure only:

> Apply face, skin, hair, body build, and wardrobe from `<IMAGE_1>` onto the leftmost figure in `<IMAGE_0>`. The leftmost figure has a concerned expression, jaw set. Preserve pose, facing, scale, and backdrop exactly.

Do **not** add dialogue or body action to Pass 2.

### After bake: video generation

When the baked frame is ready, video generation receives **only the baked image** as the start frame (identity is in the pixels). The video prompt:

- Locks composition: animate motion only — no reframe, recrop, or reposition.
- Carries compiled **action** and **expression change** from character performance fields.
- Carries global **Shot Activity** for ensemble motion.
- **Silent mode:** visual speech proxies; no quoted dialogue.
- **Native mode:** quoted dialogue per provider syntax (when supported).
- Does **not** repeat character visual descriptions.

---

## Defining Actions and Dialogue (Video Stage)

### Visual actions (silent mode and shared)

Describe **physical manifestations** of speech and emotion when not using native dialogue:

- "Moving lips as if speaking"
- "Listening intently, slight head tilt"
- "Gestures with one hand while maintaining eye contact"
- "Expression softens; corners of mouth lift slightly"

Micro-actions (blink, breathing, hair movement) belong in the video prompt and help reduce facial drift during animation.

### Native-audio prompting (native mode)

When audio mode is **Native** and the provider supports it, also describe:

- **Ambience / SFX** — footsteps, wind, room tone (Veo: explicit SFX lines; Grok: `AUDIO:` section or inline).
- **Delivery** — whisper, urgent shout, murmured (works alongside quotes).
- **Multi-speaker** — spatial label + speaker label + quote (especially Veo 3.1, Kling Omni with voice tags).

Provider capability flags (`nativeAudio: 'none' | 'prompt' | 'voice-bound'`) drive the compiler — see `APP-SHAPE.md`.

---

## Advanced Techniques for Consistency

1. **One action per character per prompt** — see above.
2. **Spatial locking** — left/right/center labels on every multi-character clause.
3. **First-frame quality constrains video** — an inconsistent bake propagates drift into video. Invest in Pass 1 integration and Pass 2 identity before iterating on motion prompts.
4. **Seed and latent reuse** — when the platform allows, keep the seed constant while altering only the action prompt to preserve faces and wardrobe while updating motion.
5. **Sequential identity for large casts** — when image-per-request limits block one-shot multi-subject identity, apply characters one at a time rather than blending all sheets into one prompt.
6. **Separate concerns across stages** — conflating placement, identity, expression, action, and dialogue in a single prompt (or a single API call) is brittle. Bake → video → audio finish keeps each stage focused.
7. **Pick the right speech tier** — native audio for drafts and exploratory dialogue; lip-sync post for exact scripts and multi-speaker bake workflows.

---

## Quick Reference: What Goes Where

| User field | Bake Pass 1 | Bake Pass 2 (identity) | Video (silent) | Video (native) | Lip-sync export |
|------------|-------------|------------------------|----------------|----------------|-----------------|
| Scene Setup | Via preview-frame builder | — | Yes (unless baked lock) | Yes (unless baked lock) | — |
| Shot Activity (general) | — | — | Yes | Yes | — |
| Character **Dialogue** | Never | Never | Proxies only | **Quoted lines** | **Yes** |
| Character **Action** | Never | Never | Yes (compiled) | Yes (compiled) | — |
| Character **Expression** (opening) | — | Yes (optional) | — | — | — |
| Character **Expression** (change) | Never | Never | Yes (compiled) | Yes (compiled) | — |
| Character sheet images | Never | **Yes** (refs) | Only if Auto-place | Only if Auto-place | — |
| Mannequin layout | Implicit (composite/mask) | Preserved | Locked after bake | Locked after bake | — |

---

## Related Documentation

- `APP-SHAPE.md` — product architecture, audio modes, provider roles, build order.
- `MANNEQUINS-BAKE-START-FRAME.md` — bake pipeline, FLUX Fill vs. xAI edit, multi-person Pass 2 strategy.
- `README.md` — workflow overview (Bake Start Frame vs. Auto-place Character).
- `lib/studio/generation-prompt.ts` — reference binding and identity pass prompt builders.
- `lib/studio/generation/adapters/inpaint.ts` — Replicate FLUX Fill + xAI image edit Pass 1 adapters.
