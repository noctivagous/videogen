# App Shape: Silent-First Pipeline with Native Audio as a Branch

How VideoGen should serve both **cinematic silent-first creators** (lip-sync finish) and **native-audio model users** (Grok, Veo, Kling Omni, Seedance, PixAI) without forking the product into two apps.

---

## Who We're Building For

VideoGen's edge is not "type dialogue into a box." It is:

- Block exact framing before generation (mannequins, bake)
- Turn film controls (field size, lens, placement grid) into prompt language
- Keep character identity stable across a shot (sheets, spatial labels, baked pixels)

That aligns with **filmmakers and ad creators** who care about composition first — whether they finish with native audio or lip-sync later.

Two user types exist, but they share the same **first 80%** of the pipeline:

| User | Cares most about | Typical finish |
|------|------------------|----------------|
| **Cinematic / control** | Framing, eyeline, lighting, exact script | Silent video → lip-sync / TTS |
| **Fast / exploratory** | Speed, one-pass "good enough" clips | Native-audio models (Grok, Veo, Kling Omni) |

**Do not fork the product.** Fork only the **last step** (how dialogue becomes sound).

---

## Recommended Shape: Staged Pipeline + Audio Mode

Think in **lanes**, not user personas:

```
┌─────────────────────────────────────────────────────────────┐
│  AUTHOR (same for everyone)                                  │
│  Characters · Scene · Camera · Mannequins · Bake             │
│  Per-character: Expression · Action · Dialogue (script)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│  VIDEO: Silent       │       │  VIDEO: Native audio │
│  (performance proxies)│       │  (quoted dialogue)   │
└──────────┬───────────┘       └──────────┬───────────┘
           ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│  FINISH: Lip-sync    │       │  FINISH: (optional)  │
│  TTS / upload audio  │       │  Re-gen / extend     │
└──────────────────────┘       └──────────────────────┘
```

**Author once.** Dialogue lives in the app as **script** regardless of path. A compiler decides whether that script goes into the video prompt, a lip-sync export, or both.

---

## Default: Silent-First — But Not Silent-Only

**Default audio mode: Silent performance** for the Bake Start Frame workflow.

Reasons tied to the architecture:

1. **Bake locks the mouth at T=0.** Native-audio models may invent speech, change lip shape, or add audio you didn't want — fighting the locked-frame philosophy ("animate motion only").
2. **Multi-character is still hard with native dialogue.** Spatial labels help; lip-sync per face after silent gen is more predictable for 2+ speakers.
3. **Exact scripts are a core ad/dubbing use case.** Native audio is generative, not teleprompter-accurate. Lip-sync + TTS remains the right finish for "these exact words."
4. **Provider-agnostic bake stays clean.** Inpaint/identity passes never need dialogue; only opening expression optionally does.

**Default is not the ceiling.** When the selected video provider supports native audio (Grok 1.5 today; Veo, Kling Omni, Seedance later), expose **Native audio** as an explicit mode — not the implicit behavior.

### Default by workflow

| Workflow | Default audio mode | Why |
|----------|-------------------|-----|
| **Bake Start Frame** | Silent | Baked pixels are the contract |
| **Auto-place Character** | Native (if provider supports) | No locked mouth; refs + prompt drive identity |
| **Pure B-roll** | Ambient only / Native SFX | No dialogue UI |
| **Multi-shot / dialogue scene** | Native (Kling Omni, etc.) | Built for that |
| **Re-style / Lip-sync** (future) | Lip-sync only | Post step |

---

## UI: One Performance Column, One Audio Control

### Per-character column (authoring — always visible when 1+ characters)

| Field | Always stored | Bake | Silent video prompt | Native video prompt |
|-------|---------------|------|---------------------|---------------------|
| **Expression** | ✓ | Opening state (optional) | Change over time | Same + delivery |
| **Action** | ✓ | — | Physical motion | Same |
| **Dialogue** | ✓ | Never | Visual proxies only | Quoted lines (provider syntax) |

Dialogue is always **script** in the data model — even in silent mode — so lip-sync export never loses the lines.

### Shot-level control

A simple **Audio** control on the shot or bottom bar:

- **Silent** — no generated speech; compile dialogue → "moving lips as if speaking" / listening beats
- **Native** — compile dialogue → provider format (quotes, `<<<voice_1>>>`, etc.); disabled when provider lacks native audio
- **Script only** — skip speech in video gen; enable **Export for lip-sync** (lines + character + timing hints)

Provider picker can **suggest** the mode ("Grok 1.5 supports native audio — switch?") but should not silently flip users into native dialogue.

### Finish step (media library / shot timeline)

After video generates:

- **Add lip-sync** — send silent clip + script/TTS to Kling Lip Sync (adapter stub exists in repo)
- **Re-generate with native audio** — same shot, flip mode, compare takes
- **Mute / replace audio** — for native clips where dialogue was wrong but picture was right

That gives cutting-edge users one-pass generation without abandoning silent-first users.

---

## Three Tiers of Speech in Video

| Tier | Mechanism | Examples | Control over exact words |
|------|-----------|----------|--------------------------|
| **A. Native generative audio** | Model invents voice + mouth motion from prompt text in one pass | Grok 1.5, Veo 3.1, Seedance 2, PixAI V3.2/V4 | Approximate — creative beats, not broadcast scripts |
| **B. Native audio + voice binding** | Pre-register a character voice; assign lines with syntax | Kling 3.0 Omni (`<<<voice_1>>>`) | Better consistency across shots; still generative |
| **C. Post-production lip-sync** | Silent video + your audio file | Kling Lip Sync, HeyGen, sync.labs | Word-perfect — recording/TTS drives the mouth |

The "silent first, lip-sync later" workflow is **Tier C**. Native-audio models are **Tier A/B**. The app supports all three via audio mode + provider capabilities.

---

## Provider Strategy (Implementation, Not Product Identity)

Do not organize the app around provider brands. Organize around **capabilities** in provider metadata (extend `workflow-capabilities.ts` / provider definitions):

```typescript
// Conceptual — extend provider model definitions
{
  nativeAudio: 'none' | 'prompt' | 'voice-bound',  // none | Grok/Veo/Seedance | Kling Elements
  lipSyncPost: boolean,
  maxRefs: number,
  firstLastFrame: boolean,
}
```

**Compiler branches on capabilities**, not hardcoded "if Grok":

| Capability | Dialogue field behavior |
|------------|-------------------------|
| `nativeAudio: 'prompt'` | Quotes + speaker labels in video prompt |
| `nativeAudio: 'voice-bound'` | Requires Element/voice ID + `<<<voice_N>>>` |
| `nativeAudio: 'none'` | Script stored; visual proxies in prompt; lip-sync export enabled |

### Provider roles

| Role | Providers | User-facing label |
|------|-----------|-------------------|
| **Draft video** | Grok 1.5, Kling Flash | "Fast preview" |
| **Finish video** | Veo 3.1, Seedance 2 Pro | "Final quality" |
| **Dialogue-native** | Kling 3.0 Omni, Veo 3.1 | "Native dialogue" |
| **Silent + lip-sync** | Any I2V + Kling Lip Sync | "Studio dialogue" (default for bake) |

Users pick **intent** ("Preview" / "Final" / "Dialogue take"); the app maps to a capable provider.

### Provider snapshot (native audio)

| | Grok 1.5 (placeholder) | Veo 3.1 | Kling 3.0 Omni | Seedance 2 | PixAI V4 |
|---|---|---|---|---|---|
| **Audio** | Native, prompt-driven | Native, always on | Native + voice Elements | Native, can disable | Toggle (ON/SE/OFF) |
| **Dialogue syntax** | Quotes, `AUDIO:` section | Quotes + speaker labels | `<<<voice_N>>>` + quotes | Double quotes | Lines in prompt |
| **Max length** | ~15s | 4–8s | ~15s | Variable | 5–15s |
| **Max resolution** | 720p | 4K | 1080p | 2K | 720p–1080p |
| **I2V from baked frame** | ✓ primary today | ✓ first frame | ✓ | ✓ + last frame | ✓ semantic refs |
| **Multi-ref** | Limited (1 image for 1.5) | 3 asset images | Elements library | 9 img + 3 vid + 3 audio | 6 img + 3 vid + 3 audio |
| **Best for VideoGen** | Draft I2V from bake | Finish + first/last frame | Multilingual dialogue | Multimodal ref hub | Anime branch |

---

## What Goes Where (Quick Reference)

| User field | Bake Pass 1 | Bake Pass 2 (identity) | Video prompt | Lip-sync export |
|------------|-------------|------------------------|--------------|-----------------|
| Scene Setup | Via preview-frame builder | — | Yes (unless baked lock) | — |
| Shot Activity (general) | — | — | Yes | — |
| Character **Dialogue** | Never | Never | Native mode only | **Yes** |
| Character **Action** | Never | Never | Yes (compiled) | — |
| Character **Expression** (opening) | — | Yes (optional) | — | — |
| Character **Expression** (change) | Never | Never | Yes (compiled) | — |

Bake uses provider-agnostic inpainting (Replicate FLUX Fill, fal.ai, xAI image edit, etc.) — not xAI-only. See `MANNEQUINS-BAKE-START-FRAME.md` and `PROMPTS-FOR-VIDEO-GENERATION.md`.

---

## Build Order

### Now (core identity)

1. Per-character Expression / Action / Dialogue fields + compiler
2. **Silent** as default for bake workflow
3. Script storage + "Export script for lip-sync" (JSON/SRT-ish — even before full lip-sync UI)
4. Provider capability flags (start with Grok: `nativeAudio: 'prompt'`)

### Next (both audiences)

5. **Audio mode** toggle per shot
6. Native branch in compiler for Grok → then Veo / Seedance when adapters land
7. Lip-sync workflow step: silent video from library → Kling Lip Sync adapter

### Later (cutting-edge power users)

8. Kling Elements / voice binding tied to Character Manager
9. Multi-provider "compare takes" (same shot, silent vs native vs different provider)
10. Dual-track export (video + dialogue stems where provider supports it)

---

## Summary

| Question | Answer |
|----------|--------|
| Mostly silent + lip-sync? | **Default path** — especially Bake Start Frame and exact scripts. |
| Cutting-edge native audio? | **First-class optional path** — same UI, different compile + provider. |
| Pick one audience? | **No.** One app; authoring unified, **audio mode** branches at generate/finish. |
| Product identity? | **Cinematic control plane** that compiles to whatever provider does best — not a Grok wrapper or a HeyGen clone. |

The mistake to avoid: optimizing the whole UX for native dialogue (competing with Kling Omni's Element library on their turf) or for silent-only (ignoring that Grok 1.5 already does speech). The win is **mannequin blocking and bake stay central; dialogue is script data that can exit as native prompt text or lip-sync input depending on one toggle.**

---

## Related Documentation

- `PROMPTS-FOR-VIDEO-GENERATION.md` — prompt compilation rules, bake vs video, per-character performance
- `MANNEQUINS-BAKE-START-FRAME.md` — two-pass bake, inpainting vs image edit
- `video-generation-workflows.json` — workflow definitions and model requirements
- `README.md` — workflow overview
