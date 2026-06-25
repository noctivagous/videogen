# Masters-per-angle asset plan

Replace the current **31 per-field-size mannequin cutouts** with a smaller set of **angle masters** (bust + full-body per gender), **6 angle-matched backdrops**, and runtime **crop / zoom / translate** for field sizes. OTS remains a small set of generative composites.

---

## Problem with the current approach

| Dimension | What field size actually means | What we do today |
|-----------|-------------------------------|------------------|
| **Field size** | How much of the subject is in frame (zoom / crop) | Separate AI-generated PNG per field size (`ms.png`, `cu.png`, …) |
| **Angle** | Camera height relative to subject (geometry changes) | CSS `rotateX` / `perspective` on the same eye-level flat cutout |

Field-size swapping made sense when each shot type needed different *content* (waist-up vs full-body with legs). Most of that range is reframing. Angle cannot be faked convincingly on a flat PNG — bird's eye and worm's eye need different source photography.

The codebase already supports geometric reframing for **user-uploaded** subjects via `FIELD_SIZE_FRAMING` / `FIELD_SIZE_HEIGHT_PCT` in `lib/constants/framing.ts`. Stock mannequins bypass it with `fieldSpecificAsset: true` in `lib/studio/subject-framing.ts`.

---

## Proposed model

```
angle master (bust or full)  +  field size  →  crop / scale / translate
angle master               +  backdrop     →  matched floor / horizon
placement / headroom       →  existing translate offsets
```

- **Angle** → which subject master + which backdrop to load
- **Field size** → derived at runtime (no per-field PNG)
- **Coverage OTS** → still separate composite assets (not a reframe)

---

## Asset inventory

### Camera angles (6)

From `CameraAngle` in `lib/types/studio.ts`:

1. `eye-level`
2. `high-angle`
3. `low-angle`
4. `birds-eye`
5. `worms-eye`
6. `dutch`

### Subject masters — 24 total

**2 masters per angle × 2 genders**

| Master | Use for field sizes | Notes |
|--------|---------------------|-------|
| **Bust** | `ecu`, `ch`, `bcu`, `cu`, `mcu`, `close-shot`, `ms` | High face resolution; chest-up or waist-up source; top of frame ~ hairline, bottom ~ belt |
| **Full** | `cowboy`, `mws`, `fs`, `ls`, `els`, `vls`, `ws`, `gv`, `xls` | Head-to-toe (or head-to-knees minimum); pull-back via scale for long shots |

**Count:** 6 angles × 2 masters × 2 genders = **24 subject PNGs**

Suggested paths:

```
public/stock/subjects/male/{angle}-bust.png
public/stock/subjects/male/{angle}-full.png
public/stock/subjects/female/{angle}-bust.png
public/stock/subjects/female/{angle}-full.png
```

`{angle}` slug: `eye-level`, `high-angle`, `low-angle`, `birds-eye`, `worms-eye`, `dutch`.

**Optional alias:** keep `mannequin-identity.png` per gender as the canonical eye-level bust for generation references only (not loaded in preview).

### Backdrops — 6 total

One neutral gray seamless studio backdrop per angle, with floor plane and horizon matched to that camera height. Shared across genders.

```
public/stock/backdrops/eye-level.jpg
public/stock/backdrops/high-angle.jpg
public/stock/backdrops/low-angle.jpg
public/stock/backdrops/birds-eye.jpg
public/stock/backdrops/worms-eye.jpg
public/stock/backdrops/dutch.jpg
```

**Count:** **6 backdrop images**

Replaces the single `/stock/studio-backdrop.jpg` for stock framing preview when angle-aware backdrops are available.

### OTS composites — 3 total (unchanged)

Not reframes of a single-subject master:

```
public/stock/subjects/ots/male-over-male.png
public/stock/subjects/ots/male-over-female.png
public/stock/subjects/ots/female-over-male.png
```

### Grand total

| Category | Count |
|----------|------:|
| Subject masters | 24 |
| Angle backdrops | 6 |
| OTS composites | 3 |
| **Total** | **33** |

Compared to **31** per-field cutouts today (plus one shared backdrop), this is similar file count but **correct angle geometry** and **one reframing code path** instead of 14+ unique field-size generations per gender.

---

## Runtime behavior

### 1. Resolve subject URL

`getSubjectCutoutUrl` (in `lib/constants/subject-cutouts.ts`) should key on:

- `coverage` → OTS path (unchanged)
- `angle` → which angle folder/slug
- `fieldSize` → `bust` vs `full` master (not `ms`, `cu`, etc.)

```ts
function resolveMasterTier(fieldSize: FieldSize): 'bust' | 'full' {
  const BUST = new Set<FieldSize>([
    'ecu', 'ch', 'bcu', 'cu', 'mcu', 'close-shot', 'ms',
  ]);
  return BUST.has(fieldSize) ? 'bust' : 'full';
}

// → /stock/subjects/male/birds-eye-bust.png
```

### 2. Resolve backdrop URL

New helper, e.g. `getAngleBackdropUrl(angle: CameraAngle)`:

```ts
// → /stock/backdrops/birds-eye.jpg
```

`getBackdropReference` in `lib/constants/stock-demo.ts` returns angle backdrop for stock preview; user-uploaded Backdrop ref still wins.

### 3. Reframe with `FIELD_SIZE_FRAMING`

Remove `fieldSpecificAsset` bypass for stock. Always apply:

- `FIELD_SIZE_HEIGHT_PCT[fieldSize]` for scale
- `aim` / `fill` from `FIELD_SIZE_FRAMING` for `object-position` or translate anchor (may need extending beyond height-only today)
- Placement translate (3×3 grid) — unchanged
- Headroom offset — unchanged

**Remove** `angleTransform()` CSS hacks for stock when a real angle master is loaded. Keep CSS dutch rotate only if dutch master is eye-level + roll; otherwise bake roll into dutch master.

### 4. Field size aliases

Keep aliases in `FIELD_SIZE_ALIASES` (`ls` → `fs`, etc.) for **framing math**, not asset filenames.

---

## Generation pipeline (replaces `subject-cutout-prompts.json` field-size chain)

### Phase 1 — Angle masters (24 images)

For each gender × angle:

1. **Generate bust** — xAI from `mannequin-identity` + angle-specific prompt  
   *"Matte gray {gender} mannequin, {angle description}, chest-up reference, neutral gray studio, film-school still, centered for compositing."*

2. **Generate full** — xAI from bust or identity + prompt  
   *"Same mannequin identity, {angle}, full body head to toe, same studio."*

3. **Matte** — RMBG-1.4 → transparent PNG (1280×720 or **higher**, e.g. 2560×1440, for ECU crop headroom)

Topological order per gender:

```
identity → eye-level-bust → eye-level-full
         → each other angle (reference: eye-level-bust or full for consistency)
```

~24 raw JPGs + 24 matted PNGs per pipeline run (not 29+ chained field sizes).

### Phase 2 — Backdrops (6 images)

Generate or photograph neutral gray seamless studio from each angle. No matting; full-frame JPG.

Prompt emphasis: visible floor plane, horizon line position, no subject, no text.

### Phase 3 — OTS (3 images)

Keep existing OTS entries in manifest; generate from appropriate bust master as reference.

### npm scripts (target)

```
stock:generate-masters   # xAI raw JPGs for 24 + 6 + 3
stock:matte-masters      # RMBG on subject PNGs only
stock:masters-pipeline   # both
```

Retire or gate old `stock:generate` field-size manifest once masters are validated.

---

## Code changes (implementation checklist)

- [ ] `lib/constants/subject-cutouts.ts` — `resolveMasterTier`, angle-based URLs
- [ ] `lib/constants/stock-demo.ts` — `getAngleBackdropUrl`, wire into `getBackdropReference`
- [ ] `lib/studio/subject-framing.ts` — drop `fieldSpecificAsset`; use `FIELD_SIZE_FRAMING.aim` for vertical anchor; disable CSS angle transform when stock angle master loaded
- [ ] `lib/constants/framing.ts` — verify / tune `spanRatio` + `aim` per field size against bust vs full master
- [ ] `components/studio/ReferencePreviewScene.tsx` — remove `usesFieldSizeCutout` branch
- [ ] `scripts/subject-cutout-prompts.json` → `scripts/master-prompts.json` (angles + OTS only)
- [ ] `scripts/generate-mannequin-cutouts.mjs` — read new manifest
- [ ] Delete or archive `public/stock/subjects/{male,female}/{ecu,cu,ms,…}.png` after QA
- [ ] Update `previewFramingFingerprint` — already includes `angle`; ensure master tier change on field size crossing bust/full boundary invalidates stale model preview if needed

---

## Open decisions

1. **Resolution** — Single 2560×1440 master per file vs 1280×720? Higher res improves ECU crops from bust master; costs more storage and matting time.

2. **Dutch** — Dedicated master + backdrop, or eye-level master + CSS `rotate(-2.5deg)` only? Plan assumes dedicated (included in counts).

3. **Bust/full boundary** — `ms` on bust, `cowboy` on full. If cowboy feels too tight, move `ms`/`cowboy` split or use full master with aggressive crop for MS.

4. **Backdrop parallax** — `getBackdropLayerStyle` already pans slightly with placement; angle backdrop may need reduced pan so floor perspective stays believable.

5. **Migration** — Run both systems behind a flag (`USE_ANGLE_MASTERS`) until framing QA passes for all field sizes × angles.

---

## QA matrix

Validate preview for each cell:

- 6 angles × representative field sizes (`ecu`, `cu`, `ms`, `cowboy`, `fs`, `els`)
- 2 genders
- 16:9 + one vertical aspect (9:16)
- 3×3 placement corners + center

OTS: 3 variants smoke test only.

---

## Summary

| Before | After |
|--------|-------|
| 31 field-size cutouts (eye-level only) | 24 angle masters (bust + full × gender) |
| 1 shared backdrop | 6 angle-matched backdrops |
| CSS fake angles | Real angle photography |
| `fieldSpecificAsset` special case | Unified reframing via `FIELD_SIZE_FRAMING` |
| Long xAI dependency chain per field size | Short chain: identity → masters per angle |

**33 total assets** (24 + 6 + 3 OTS) with honest angles and simpler runtime logic.