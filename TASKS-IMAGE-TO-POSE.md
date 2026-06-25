# Image-to-Pose for PoseBlock

**Status:** Not started (spec only — no estimation, retargeting, or drop handler in tree)

**Goal:** User provides a reference photo; system estimates a pose and applies it to the live Mixamo mannequin(s) in under ~2s, ready for export.

**Agent context:** Read `PoseBlock/AGENTS.md` before touching PoseBlock source. Trust `package.json` and source over `README.md`.

**Effort (HMR path):** ~80 lines of retarget math; ~2–3 hours to reach ~90% quality, ~1 day to tune offsets and test edge cases. Complexity is in gotchas and photo testing, not the conversion formula.

---

## Current codebase (what exists)

### Architecture

- **Compositor:** `PoseBlock/components/PoseBlockCompositor.tsx` — embeddable root (VideoGen imports this). Renders `PreviewFrame` (2D `<img>` backdrop) + transparent R3F `Scene` overlay (orthographic, `alpha: true`, `preserveDrawingBuffer: true`). Export composites at backdrop native resolution via `PoseBlock/lib/exportComposite.ts`.
- **Multi-instance:** Zustand store holds `instances: CharacterInstance[]` (`MAX_INSTANCES = 10`). Selection, pins, IK blend, and pose state are **per instance**. Outward callbacks: `onInstanceChange` / `onSelect` registered by the compositor.
- **Active renderer:** `PoseBlock/components/CharacterManipulator.tsx` (`CharacterManipulatorLayer` in `Scene.tsx`). **`Character.tsx` is legacy single-instance code and is not mounted.**
- **UI:** Leva was removed. Standalone dev panel: `PoseBlockDevPanel`. VideoGen sidebar: `components/studio/PoseBlockPanel.tsx`. Pose controls: `PoseSourceControls`, `PoseAdjustToolbar`, joint/cylinder gizmos.
- **Package boundary:** PoseBlock is npm package `poseblock` (`file:./PoseBlock`). Use **relative imports only** in `components/`, `lib/`, `index.ts` — never `@/`.

### Pose application flow (today)

1. **Base pose** from `poseSourceMode`:
   - `'preset'` → `instance.basePoseId` lookup in `getAllPosePresets(posePresets)` (`POSES` + JSON presets)
   - `'animation'` → sampled frame via `useAnimationPoseSample` from GLBs in `poses/pose-models/`
2. **Adjustments** → `composePose(base, instance.poseAdjustments)` (`PoseBlock/lib/poseCompose.ts`)
3. **Apply** → `lerpPose(skeleton, composedPose, 1)` (`PoseBlock/lib/poses.ts`)
4. **Bind alignment** → GLB/FBX skeletons aligned to Mixamo reference bind via `alignSkeletonToMixamoBind` (`PoseBlock/lib/mixamoBind.ts`, reference in `poses/mixamo-reference-bind.json`) before poses apply
5. **Control rig mode** → CCDIKSolver targets from `instance.controlRig`
6. **Joint limits** → `PoseBlock/lib/poseJointConstraints.ts`
7. **Hand gestures** → `handGesturePose('Left'|'Right', 'open'|...)` in `PoseBlock/lib/proceduralPoses.ts` (reuse after body-only HMR output)

### Critical: `Pose` is bind-relative, not absolute

Presets store **delta quaternions** from each bone's bind local rotation. `lerpPose` computes:

```ts
targetLocal = bindQ.multiply(deltaQ)  // see PoseBlock/lib/poses.ts
```

**Do not** write absolute local quats straight to bones or into `estimatedPose`. The retargeter must output `Pose` (bind-relative `[x,y,z,w]` tuples). After computing target local from SMPL:

```ts
deltaQ = bindQ.clone().invert().multiply(targetLocal)
pose[boneName] = [deltaQ.x, deltaQ.y, deltaQ.z, deltaQ.w]
```

Use `findSkeletonBone` + per-skeleton bind cache from `getBindPose`, or `getReferenceBindQuaternion` from `mixamoBind.ts` when aligned to reference bind.

### Data & APIs

| Resource | Location |
|----------|----------|
| Character GLBs | `public/models/X Bot.glb`, `Y Bot.glb` |
| Reference bind | `PoseBlock/poses/mixamo-reference-bind.json` |
| Pose JSON presets | `PoseBlock/poses/` (~39 files) |
| Animation pose GLBs | `poses/pose-models/` (gitignored) |
| VideoGen pose API | `GET /api/poseblock/poses` |
| Mixamo bone list | `MIXAMO_BONES` in `PoseBlock/lib/poses.ts` (~65 bones) |

### Partial / adjacent work (not image→pose)

- **`lib/studio/pose-export/index.ts`** — skeleton → MediaPipe landmarks (export). Inverse mapping does not exist.
- **`@mediapipe/tasks-vision`** in root lockfile (transitive); not wired for estimation.
- **SAM 3D Body** (`tools/sam3d/`) — mesh generation pipeline, not live retargeting.

### Not built

- No `/api/pose` route, no `smplToMixamo.ts`, no store method for estimated poses
- No drop handler; no `poseSourceMode: 'estimated'`
- No pose tween on apply (instant `lerpPose(..., 1)`)

---

## SMPL → Mixamo retargeting (HMR 2.0 path)

**Recommended production backend:** HMR 2.0 / 4D-Humans via fal.ai. Returns `smpl_pose`: **24 joints × 3 axis-angle = 72 floats**. Target: Mixamo bone subset as `Pose` (~20–30 body bones; fingers handled separately).

### Core conversion (~40 lines of math)

```ts
// 1. Reshape
const smplPose = result.smpl_pose // 72 floats

// 2. Per joint: axis-angle → quaternion
function axisAngleToQuat(ax: number, ay: number, az: number): THREE.Quaternion {
  const angle = Math.sqrt(ax * ax + ay * ay + az * az)
  if (angle < 1e-4) return new THREE.Quaternion()
  return new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(ax, ay, az).normalize(),
    angle,
  )
}

// 3. Map SMPL joint index → Mixamo bone(s), apply offsets, convert to bind-relative Pose
```

Implement in **`PoseBlock/lib/smplToMixamo.ts`** (pure Three.js math; vitest-friendly). Optional wrapper **`PoseBlock/lib/retarget.ts`** re-exports `smplToMixamo` + future `mediapipeToMixamo`.

### SMPL joint indices (HMR 2.0)

| Index | SMPL name | Mixamo bone(s) |
|------:|-----------|----------------|
| 0 | Pelvis | `Hips` |
| 1–2 | LeftHip, RightHip | `LeftUpLeg`, `RightUpLeg` |
| 3, 6, 9 | Spine1, Spine2, Spine3 | Split → `Spine`, `Spine1`, `Spine2` |
| 4–5 | LeftKnee, RightKnee | `LeftLeg`, `RightLeg` |
| 7–8 | LeftAnkle, RightAnkle | `LeftFoot`, `RightFoot` (+ foot offset) |
| 10–11 | LeftFoot, RightFoot | `LeftToeBase`, `RightToeBase` |
| 12 | Neck | `Neck` |
| 13–14 | LeftCollar, RightCollar | `LeftShoulder`, `RightShoulder` |
| 15 | Head | `Head` |
| 16–17 | LeftShoulder, RightShoulder | `LeftArm`, `RightArm` (+ T-pose offset) |
| 18–19 | LeftElbow, RightElbow | `LeftForeArm`, `RightForeArm` |
| 20–21 | LeftWrist, RightWrist | `LeftHand`, `RightHand` |

Spine split (avoid kinked back): e.g. `Spine = slerp(Spine1, Spine2, 0.33)`, `Spine1 = Spine2`, `Spine2 = Spine3`.

### Six gotchas (+ one PoseBlock-specific)

| # | Issue | Fix |
|---|-------|-----|
| 1 | **T-pose vs A-pose** — SMPL rest = A-pose (~45° arms down); Mixamo bind ≈ T-pose | Multiply shoulder deltas by `T_POSE_OFFSET` (Z +π/4 left, conjugate right). **Tune visually on X Bot.** |
| 2 | **Hierarchy mismatch** — 24 SMPL joints vs ~65 Mixamo bones | Map table above; split spine; skip unmapped bones |
| 3 | **Coordinate flip** — SMPL Y-up, −Z forward; Three.js +Z forward | Flip root: negate Z on `Hips` delta (and verify facing in ortho view) |
| 4 | **Hands** — HMR body-only → fists | Merge `handGesturePose('Left','open')` + `handGesturePose('Right','open')` into result, or MediaPipe Hands pass |
| 5 | **Feet** — SMPL feet forward in rest; Mixamo feet down | `FOOT_OFFSET` (~π/2 X) on `LeftFoot`/`RightFoot`; tune on mannequin |
| 6 | **Global transform** — HMR pose in camera space | Use rotation only; **ignore root translation** — PoseBlock positions via normalized anchor `x`/`y`/`scale` |
| 7 | **Bind-relative `Pose`** — PoseBlock preset format | Convert each target local → `bindQ⁻¹ × targetLocal` before `lerpPose`; never `bone.quaternion.copy(absQuat)` |

**Do not use** the outdated `smpl-to-mixamo` npm package. Implement ~80 lines in-repo; calibrate `T_POSE_OFFSET` / `FOOT_OFFSET` once against `X Bot.glb`.

### Apply path (correct for PoseBlock)

```ts
// After /api/pose returns bind-relative Pose JSON
store.applyEstimatedPose(primaryId, pose)  // sets estimatedPose + poseSourceMode: 'estimated'

// CharacterManipulator already calls:
lerpPose(skeleton, composedPose, 1)  // composedPose includes estimated base + optional adjustments
```

Post-process in converter or `applyEstimatedPose`:

```ts
Object.assign(pose, handGesturePose('Left', 'open'), handGesturePose('Right', 'open'))
// optional: clamp via constraintForBone from poseJointConstraints.ts
```

---

## Feature design

### User flows

1. **Standalone PoseBlock:** drop JPG/PNG on `PreviewFrame` (or file picker).
2. **VideoGen embed:** **“Match backdrop”** — estimate from shot backdrop URL already in compositor.

### Integration point

```ts
// PoseBlock/lib/instances.ts
poseSourceMode: 'preset' | 'animation' | 'estimated'
estimatedPose: Pose | null
```

`CharacterManipulator` composed-pose memo: branch `'estimated'` → `instance.estimatedPose`. Reset `poseAdjustments` on new estimate (user can fine-tune after via gizmos).

### Backend vs in-browser

| Model | Where | Notes |
|-------|-------|-------|
| **HMR 2.0 / 4D-Humans** | VideoGen `app/api/pose/route.ts` | **Recommended.** fal.ai; `FAL_KEY`; return bind-relative `Pose` JSON |
| MediaPipe Pose | Browser `PoseBlock/lib/mediapipeToMixamo.ts` | Optional MVP (~100ms, free); 2D landmarks, different gotchas (depth ambiguity) |

API can run `smplToMixamo` server-side **or** return raw `smpl_pose` and convert client-side (keeps `/api/pose` thin). Prefer server-side if same code is shared with tests.

---

## Task list

### Phase 1: Setup & research

- [x] 1.1 PoseBlock runs (standalone + VideoGen `file:./PoseBlock`)
- [x] 1.2 Document pose flow — see above + `PoseBlock/AGENTS.md`
- [x] 1.3 HMR 2.0: 72-float SMPL axis-angle output; fal.ai 4D-Humans endpoint
- [x] 1.4 **Primary: HMR 2.0** for production quality; MediaPipe optional fast MVP
- [x] 1.5 SMPL→Mixamo joint map + gotchas documented (this file); MediaPipe inverse TBD

### Phase 2: Backend API (HMR)

- [ ] 2.1 Create `app/api/pose/route.ts` in **VideoGen** (hosts `FAL_KEY`)
- [ ] 2.2 POST FormData image, validate `<10MB`
- [ ] 2.3 `fal.subscribe("fal-ai/4d-humans", { input: { image_url } })` (or chosen model)
- [ ] 2.4 Parse `smpl_pose` (72 floats) + confidence
- [ ] 2.5 Run `smplToMixamo(smplPose)` → bind-relative `Pose`
- [ ] 2.6 Return `{ success, pose: Record<string, [x,y,z,w]>, confidence }`
- [ ] 2.7 Errors: no person, multiple people, low confidence threshold

### Phase 3: Frontend handler

- [ ] 3.1 Drop zone on `PreviewFrame` / compositor; `embedMode`: `estimateFromImage(url | File)`
- [ ] 3.2 Loading state during estimation
- [ ] 3.3 Resize image max 1024px
- [ ] 3.4 POST `/api/pose` (or MediaPipe in-browser for MVP flag)
- [ ] 3.5 `applyEstimatedPose(primarySelectedId, pose)`
- [ ] 3.6 Error → `characterError` / toast
- [ ] 3.7 VideoGen: “Match backdrop” in `PoseBlockPanel`

### Phase 4: Retargeting engine

- [ ] 4.1 **`PoseBlock/lib/smplToMixamo.ts`** — axis-angle → quat, joint map, T-pose + foot offsets, coord flip, bind-relative output
- [ ] 4.2 **`absoluteToBindRelativePose(skeleton | referenceBind, absLocals): Pose`** helper (shared with animation path if needed)
- [ ] 4.3 Post-process: merge open-hand gestures; optional `constraintForBone` pass
- [ ] 4.4 *(Optional MVP)* `PoseBlock/lib/mediapipeToMixamo.ts` — 2D landmarks → bone directions
- [ ] 4.5 Vitest: axis-angle round-trip, spine split, bind-relative conversion on fixture quats (no WebGL)

### Phase 5: Store & compositor integration

- [ ] 5.1 Extend `CharacterInstance` + `PoseBlockInstance` with `estimatedPose`, `'estimated'` mode
- [ ] 5.2 `applyEstimatedPose(id, pose)` in store; emit `onInstanceChange`
- [ ] 5.3 `CharacterManipulator` composed-pose branch
- [ ] 5.4 Control-rig re-init from estimated pose
- [ ] 5.5 Estimated pose ephemeral — not written to `poses/`

### Phase 6: Animation & polish

- [ ] 6.1 Tween apply ~300ms (slerp per bone in `useFrame`)
- [ ] 6.2 Visual feedback during estimation
- [ ] 6.3 File picker fallback
- [ ] 6.4 Undo snapshot before estimate
- [ ] 6.5 Tune `T_POSE_OFFSET` / `FOOT_OFFSET` on X Bot; document final values in code comments

### Phase 7: Testing & edge cases

- [ ] 7.1 Full-body, half-body, profile, sitting, occluded limbs (~20 photos for offset tuning)
- [ ] 7.2 Pinned feet after estimate
- [ ] 7.3 IK blend 0.5
- [ ] 7.4 Export at native backdrop resolution
- [ ] 7.5 Multi-instance: primary only
- [ ] 7.6 Low-confidence HMR responses — reject or fall back to T-pose + error
- [ ] 7.7 Latency `<2s` end-to-end

### Phase 8: Documentation

- [ ] 8.1 README / INTEGRATION.md section
- [ ] 8.2 Env: `FAL_KEY`, `POSE_MODEL=hmr|mediapipe`
- [ ] 8.3 API response shape for host
- [ ] 8.4 Example photos in `public/examples/`

---

## Acceptance criteria

- [ ] Reference image → primary mannequin posed within ~2s
- [ ] Major joints within ~15° on 3+ test photos (after offset tuning)
- [ ] Works in preset and control-rig modes
- [ ] Pinned feet stay pinned
- [ ] Open hands (not HMR fists) unless user adjusts
- [ ] Export PNG correct at full resolution
- [ ] No regression: presets, animation sampling, gizmos, multi-select, anchors

---

## Tech stack constraints

| Item | Version / rule |
|------|----------------|
| Next.js | 16 |
| React | 19 |
| R3F / drei | v9 / v10 |
| Three.js | 0.175 |
| Zustand | 5 |
| PoseBlock imports | Relative paths only |
| New deps | >100kb needs approval; **no** `smpl-to-mixamo` npm |

---

## Deliverables

1. **`PoseBlock/lib/smplToMixamo.ts`** (~80 lines + bind-relative helper)
2. **`app/api/pose/route.ts`** (VideoGen) — fal HMR → `Pose` JSON
3. Store + types for `estimated` pose source
4. `CharacterManipulator` branch + `applyEstimatedPose`
5. Drop / match-backdrop UI
6. Vitest fixtures for retarget math
7. Demo: 3 photos → pose → export

---

## References

- `PoseBlock/AGENTS.md` — architecture, commands
- `PoseBlock/lib/poses.ts` — `Pose`, `lerpPose`, `findSkeletonBone`
- `PoseBlock/lib/mixamoBind.ts` — reference bind alignment
- `PoseBlock/lib/proceduralPoses.ts` — `handGesturePose('open')`
- `PoseBlock/lib/poseJointConstraints.ts` — post-retarget clamping
- `lib/studio/pose-export/index.ts` — MediaPipe bone index (export direction)
