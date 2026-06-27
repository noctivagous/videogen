# AGENTS

## Setup gotchas
- Node `>= 22.0.0` is required (see `package.json.engines`). Vercel/Next only works with that major version.
- The 3D compositor lives in `PoseBlock/`, which is a git submodule and also the local `poseblock` dependency. Always clone/update with `git submodule update --init --recursive` before `npm install` so `PoseBlock/public/models` exists.
- `npm install` runs `scripts/link-poseblock-assets.mjs` as `postinstall`, which symlinks/copies `PoseBlock/public/models` into `public/poseblock-models`. When the link is missing (new clone or after pulling new models) rerun `npm run setup:poseblock` after updating the submodule; otherwise the compositor cannot load GLBs.

## Key commands you would otherwise guess wrong
- `npm run dev` starts the Next 16 app on 3000; use `NEXT_PUBLIC_POSEBLOCK_COMPOSITOR=1` before the command if you want the PoseBlock WebGL compositor instead of the vanilla PNG mannequins.
- `npm run dev:clean` kills ports 3000/3001 and removes `.next` before rerunning `next dev`—handy when you hit port conflicts or stale builds.
- `npm run build` (or `npm run build:clean`) runs `next build` and already typechecks; `npm run typecheck` (`tsc --noEmit`) is faster when you just need to verify types.
- `npm run lint` uses the custom `eslint.config.mjs`; `npm run test` / `npm run test:watch` run Vitest (configured to only pick up `**/*.test.ts`).
- `npm run check:secrets` is the repo’s quick grep for leaked tokens—run it before commits that touch credential-heavy files.

## PoseBlock integration
- VideoGen depends on the local `poseblock` package (`package.json` sets it to `file:./PoseBlock`) and Next’s `transpilePackages: ['poseblock']` in `next.config.ts`. The root `tsconfig.json` explicitly excludes the `PoseBlock` folder so the host app compiles it at runtime.
- `public/poseblock-models` is not checked in but exposed via `scripts/link-poseblock-assets.mjs`; keep it linked/copyed while developing instead of duplicating assets. If you remove or refresh the submodule you must re-run the script manually otherwise `next dev` cannot serve the GLBs.
- The compositing and pose data are defined inside `PoseBlock/`; read `PoseBlock/AGENTS.md` and `PoseBlock/INTEGRATION.md` before editing there.

## Filetree layout
- `app/` — Next.js App Router pages: `api/` (bake, generate, preview-frame, poseblock, project-storage, providers), `studio/[panel]/` (studio routes), `page.tsx` (root).
- `components/studio/` — All studio UI panels, managers, overlays, and controls; organized into subdirs (character-manager, entity-picker, location-manager, media-library) plus flat component files.
- `components/ui/` — Shared/generic UI primitives (ColorWheel, MentionTextarea, RangeSlider, Select, etc.).
- `lib/constants/` — Every option set/constant used by UI dropdowns and prompts (camera, lens, framing, mannequin, providers, workflows, etc.).
- `lib/media/` — Media library logic: queries, mutations, clip search, color palette groups.
- `lib/poseblock/` — Adapter layer between the host app and the PoseBlock submodule.
- `lib/storage/` — Client + server storage: project I/O, asset paths, provider keys, secrets sanitization.
- `lib/studio/` — Core studio domain logic: generation adapters (fal, kling, luma, openai, etc.), humanoid figure/pose, bake start frame, mannequin bounds, workflow, prompts, shot settings.
- `lib/types/` — Shared TypeScript types for media-library and studio.
- `lib/ui/` — UI utilities: context-menu, modal-stack.
- `store/` — Zustand stores: useStudioStore, useStudioPanelInspectorStore, useEntityImageAssociateStore.
- `hooks/` — React hooks (apps-launcher, file-system-access, studio-panel-navigation).
- `types/` — Ambient type declarations (scene-debug.d.ts).
- `public/` — Static assets: `mannequins/` (PNG angle renders), `poseblock-models/` (symlink to PoseBlock), `service-provider-logos/`, `stock/`.
- `scripts/` — Build/data-generation scripts (mannequin angles/cutouts, stock previews, look previews, poseblock asset linking).
- `project-plans/` — Design docs, task lists, reference materials (FILM-TERMS, BRIDGE-TO-CINEMATOGRAPHY, etc.).
- `PoseBlock/` — Git submodule: Three.js compositor with pose editing/adjustment, character models, pose presets. Its `public/models/` contains the GLB character files consumed via symlink.

## Data/layout contracts
- `video-generation-workflows.json` is the source of truth for every workflow dropdown, availability check, and Bake Start Frame checklist step—edit it if you are adjusting workflows rather than scattering logic around the UI.
