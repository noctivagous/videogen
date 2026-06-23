# Mannequin PR Tracker

Canonical status for mannequin-related work. **Two parallel stacks reuse PR numbers** — always check which stack a PR belongs to.

Last updated: 2026-06-20

---

## Stack A — Mannequin-first composition

Makes mannequins the universal shot-composition layer for **Auto-place** and **Lock Start Frame**. Cutouts retired; camera + composition guide drive layout.

| PR | Status | Summary | Key files |
|----|--------|---------|-----------|
| **PR1** | ✅ Done | Unified `syncMannequinsFromShot`, always-on `MannequinPlacementLayer`, cutouts removed, group/crowd limits (5/10) | `lib/studio/mannequin-sync.ts`, `lib/studio/mannequin-factory.ts`, `PreviewPanel.tsx`, `ReferencePreviewScene.tsx` |
| **PR2** | ✅ Done | Smart resync on field size, subject count, coverage; preserve manual drags when far from layout default | `lib/studio/mannequin-sync.ts`, `store/useStudioStore.ts` |
| **PR3** | ✅ Done | Placement grid + headroom → feet anchor; force-snap on explicit placement; canvas grid click-to-place | `mannequin-sync.ts` (`getLayoutAnchor`), `CompositionOverlay.tsx`, `CameraPanel.tsx` |
| **PR4** | ⬜ Remaining | `buildMannequinBlockingPrompt()` — inject mannequin x/y/scale into **Auto-place** generation prompts | `lib/studio/generation-prompt.ts` (new helper), `lib/studio/mannequin-character-assignment.ts` (`mannequinSpatialLabel`) |
| **PR5** | ⬜ Remaining | `castTier: 'principal' \| 'extra' \| 'crowd'` on `Mannequin`; assignment UI + bake Pass 2 only for principals | `lib/types/studio.ts`, `mannequin-character-assignment.ts`, `workflow.ts` |

### Ad-hoc fixes (not numbered PRs)

- CU/ECU feet-below-frame, scale-aware `maxFeetAnchorY`, editable scale in inspector
- Click-through transparent mannequin PNGs; inspector panel `z-50`

### Deferred (post PR5)

- **Described extras** — text description per mannequin, no character sheet
- **Scene objects** — props, vehicles, lights (`SceneEntity` union); design only
- Retire or fold `VectorBlockingScene.tsx` into mannequin sync

---

## Stack B — Bake & character assignment

Lock Start Frame two-pass bake and mannequin → character sheet assignment.

| PR | Status | Summary | Key files |
|----|--------|---------|-----------|
| **PR1** | ✅ Done | `mannequin.subjectSlotIndex`, migration, `assignMannequinSubjectSlot`, inspector dropdown | `lib/types/studio.ts`, `migrate-mannequin.ts`, `mannequin-character-assignment.ts`, `useStudioStore.ts` |
| **PR2** | ✅ Done | Drag-connector extract, `CharacterAssignmentConnector`, persistent assignment lines, slot drag handles | `lib/studio/drag-connector.ts`, `CharacterAssignmentConnector.tsx`, `CharacterAssignmentLines.tsx`, `ThemeTransformConnectorProvider.tsx` |
| **PR3** | ✅ Done | Workflow step *Assign Characters*, auto-assign single-subject, mobile dropdown fallback | `lib/studio/workflow.ts`, `ReferenceSlots.tsx`, `MannequinPlacementLayer.tsx` |
| **PR4** | ✅ Done | Multi-subject Pass 2 — `buildIdentityPassPlan()`, sequential identity passes, store `identityPasses[]` | `lib/studio/bake-identity-pass.ts`, `app/api/bake-start-frame/route.ts`, `useStudioStore.ts` |
| **Phase 5** | ⬜ Remaining | Unit tests (sync, smart resync, identity pass planning, assignment validation). Vitest not set up yet | — |

Bake architecture and prompt details: [`MANNEQUINS-BAKE-START-FRAME.md`](MANNEQUINS-BAKE-START-FRAME.md)

---

## What’s next (recommended order)

1. **Composition PR4** — Auto-place blocking prompts from mannequin positions
2. **Composition PR5** — `castTier` + principal-only assignment/bake
3. **Bake Phase 5** — test runner + guards for sync/assignment/bake planning

---

## Design references

| Topic | Location |
|-------|----------|
| Bake two-pass design, cast tiers, orchestration | [`MANNEQUINS-BAKE-START-FRAME.md`](MANNEQUINS-BAKE-START-FRAME.md) |
| Composition stack origin (mannequin-first plan) | Grok session plan — not in repo; superseded by this tracker for status |
| Field size / subject count semantics | [`FILM-TERMS.md`](FILM-TERMS.md), [`SUBJECT-COUNTS.md`](SUBJECT-COUNTS.md) |

---

## Updating this file

When a PR ships:

1. Change status in the table above
2. Add a one-line note under **Ad-hoc fixes** if the work wasn’t a numbered PR
3. Update **Last updated** date
4. If bake doc PR sections conflict, fix [`MANNEQUINS-BAKE-START-FRAME.md`](MANNEQUINS-BAKE-START-FRAME.md) to match