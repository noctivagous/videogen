**Recommended input combination for VGen Studio**

To support image-referenced video generation (like Grok’s upload + natural-language referencing), while staying true to the app’s clean, professional layout and existing “Motion & Subject” controls, here’s the balanced design:

### Core Input Data per Shot / Generation
- [ ] **Text Prompt** (still the creative heart — required)
- [ ] **0–3 Reference Images** (optional but powerful visual anchors)
  - [ ] Max **3 images total** per shot/video. This is a practical sweet spot used by most current video models (Luma, Kling, Runway Gen-3, Pika, etc.). It gives enough power for subject consistency + style + motion guidance without overwhelming the interface or the underlying model.
  - [ ] Suggested **roles** for the three slots (user can change):
    - [ ] **Subject / Character** — face, clothing, identity consistency
    - [ ] **Style / Environment** — lighting, color palette, aesthetic, background
    - [ ] **Motion / Composition** — pose, action, camera framing, or start/end frame guidance
- [ ] Existing controls remain:
  - [ ] Camera, Lighting, Motion intensity + Subject action, Stabilization, etc.
  - [ ] Shot list (references can be **per-shot** for multi-shot stories)

This combination gives precise visual grounding (the images) + high-level creative direction (the prompt) + technical control.

### Aspect Ratio Settings (New First-Class Control)

Add a dedicated **Aspect Ratio** dropdown in the top bar (group it with Resolution / FPS / Duration for consistency).

**Options**:
- [ ] 16:9 Landscape (default — cinematic)
- [ ] 9:16 Portrait (vertical video, Reels, TikTok, Stories)
- [ ] 1:1 Square (social posts, Instagram)
- [ ] 4:3 Classic (film look)
- [ ] 21:9 Ultra-wide / Cinematic

**Behavior**:
- [ ] When user changes aspect ratio, automatically update the Resolution dropdown to sensible matching presets (e.g. 16:9 → 1920×1080 or 3840×2160; 9:16 → 1080×1920).
- [ ] Dynamically change the central preview frame’s aspect ratio (switch Tailwind `aspect-video` to `aspect-[16/9]`, `aspect-[9/16]`, `aspect-square`, etc. or use a responsive wrapper).
- [ ] Store in `state.project.aspectRatio` and persist with save/load.
- [ ] This pairs perfectly with image references — e.g. upload a vertical portrait photo → choose 9:16 so the video respects the subject’s framing.

This gives users explicit compositional control instead of only inferring it from resolution.

### Prompt + Image References UI (Bottom Section)

Keep the existing prompt textarea and “Motion & Subject” grid, but add a clean **Image References** row directly above the prompt (still inside the bottom glass bar).

**Layout** (horizontal on desktop, wraps nicely on mobile):
- [ ] Three compact upload cards side-by-side (roughly 1/3 width each).

**Each card**:
- [ ] Empty state: dashed border + upload icon + “Upload reference” label + small text “Subject”, “Style”, or “Motion” as default role.
- [ ] After upload: 
  - [ ] Thumbnail preview (with nice rounded corners)
  - [ ] Short filename or “Ref 1”
  - [ ] Small **Role** dropdown (Subject • Style • Motion • General)
  - [ ] Red X remove button
- [ ] Support click-to-upload + drag & drop (global drop zone on the whole bottom bar is even nicer).
- [ ] Max 3 images enforced (disable further uploads or show “3/3 used”).

**Prompt textarea enhancements**:
- [ ] Updated placeholder example:  
  `A cinematic shot of the person in reference 1 walking through a neon-lit cyberpunk city at night, heavy rain, style of reference 2, dynamic low-angle camera move...`
- [ ] When any images are present, show a subtle one-line helper directly above the textarea:  
  `Tip: Reference them naturally — “the woman from ref 1”, “in the style of image 2”, or “motion like ref 3”.`
- [ ] Optional polish: Make the three thumbnails clickable — clicking one inserts helpful text at the cursor (e.g. “the character in reference 1”).

**Tie-in with existing features**:
- [ ] References live **per active shot** (when you click a shot in the timeline, its images load).
- [ ] On Generate, the simulation can acknowledge them (e.g. in the success state show “Generated using 2 reference images + prompt”).

### Why this design works well
- [ ] **Max 3 images** keeps the UI calm and focused while still delivering real power (subject consistency + style + motion).
- [ ] Explicit roles + natural-language prompt = best of both worlds: structured guidance where it helps, creative freedom where it matters.
- [ ] Aspect ratio as a top-level control makes composition intentional and pairs beautifully with the reference images.
- [ ] Everything stays in the same visual language (glass cards, brand indigo accents, clean typography) and respects the existing camera/lighting/motion sections.

This creates a harmonious input system: the reference slots provide clear structure and precision, while the prompt remains the open creative space.

Would you like me to implement this directly in the VideoGen.html file (add the three reference upload cards, role selectors, dynamic aspect-ratio preview, state handling for images, and updated generate logic)? I can do it cleanly as incremental edits.