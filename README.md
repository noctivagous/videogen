VideoGen

VideoGen is a workflow-based video generation app,
BYOK (Bring Your Own Keys) multi-provider,
centered around shot design.  It is under development.
It provides multiple workflows for making shots.

The user interface centers on the user making
a shot.  Within that shot, the user can utilize
one or more workflows to generate media.
The media are available in a media library


## Workflows and mannequin frame blocking

Each shot has multiple available **Workflows** in the left panel. 
Workflows define how reference images, mannequins, and camera settings feed into generation.
Definitions live in `video-generation-workflows.json` and drive the workflow dropdown, capability checks, and (for bake workflows) the shot checklist.

**Implemented today:** Bake Start Frame, Auto-place Character. Other workflows appear in the picker but are not fully wired yet.

### Mannequin frame blocking (Bake Start Frame)

The default workflow (**Bake Start Frame**) uses gray **mannequins** on the backdrop to block character placement before video generation. You position mannequins in the preview, assign character sheets to them, then **bake** a start frame so the video model only adds motion from your prompt.

The camera-panel **Checklist** tracks progress:

1. **Character Sheet** — subject reference slot filled (one sheet per principal mannequin when needed)
2. **Backdrop** — backdrop reference slot filled
3. **Place Mannequins** — at least one principal mannequin in the scene
4. **Assign Characters** — each principal mannequin linked to its character sheet
5. **Bake** — baked start frame ready to send as the video input

Reference slots for Character Sheet and Backdrop sit directly under their checklist steps. The blocking preview (Framing tab) shows mannequin layout only; baking composites characters into the backdrop via image edit. See `MANNEQUINS-BAKE-START-FRAME.md` for the two-pass bake design.

**Auto-place Character** can optionally use mannequins for blocking but does not bake a first frame — character sheet and backdrop go to the model separately and the prompt drives placement.

### Character workflows

| Workflow | Summary | When to use | Model needs |
|----------|---------|-------------|-------------|
| **Bake Start Frame** *(default)* | Mannequins block framing; bake composites character(s) into backdrop; video model adds motion only. | Eyeline, exact framing, or lighting match matters. | Image edit (`inpaint` preferred; falls back to xAI image edit). |
| **Auto-place Character** | Character sheet + backdrop sent separately; model infers scale/position. Optional mannequin blocking. No bake step before submitting to video model. | Fast iteration. | Image-to-video (Kling, Runway, Veo, Luma, etc.). |

### Environment workflows

| Workflow | Summary | When to use | Model needs |
|----------|---------|-------------|-------------|
| **Pure B-roll (no character)** | Backdrop only or text-to-video. Field Size, Lens, and Angle drive the image; prompt is atmosphere and camera move. No character sheet. | Establishing shots, landscapes, atmosphere. | Text-to-video or image-to-video. |
| **Start & End Frame** | Two baked frames; model interpolates between them. | Product reveals, logo landings — reliable opening and closing look. | First/last frame control (Kling 3.0+, Runway Gen-4, Veo 3.1). |

### Motion workflows

| Workflow | Summary | When to use | Model needs |
|----------|---------|-------------|-------------|
| **Motion Transfer / Performance** | Reference video drives character performance (Kling Motion Control, Viggle-style). Field Size and Lens are ignored — motion defines framing. | Apply motion or performance from one asset to another. | Motion transfer / pose control (Kling, Viggle, Runway Act-One). |
| **Multi-shot Sequence** | One prompt yields 3–6 connected shots (Kling 3.0). Subject Count and Coverage become shot-list items, not single-frame settings. | — | Kling 3.0+ native multi-shot. |

### Camera workflows

| Workflow | Summary | When to use | Model needs |
|----------|---------|-------------|-------------|
| **Camera Control** | Camera moves on a static scene or first frame — crane, dolly, pan, tilt, orbit. No character animation. | Establishing shots and product turntables where camera movement is the story. | Camera-control support (Runway Gen-4, Kling 3.0, Veo 3.1, Luma). |

### Edit workflows

| Workflow | Summary | When to use | Model needs |
|----------|---------|-------------|-------------|
| **Video Inpaint / Object Removal** | Mask objects in existing video; model fills with temporally consistent background. | Clean up footage without reshooting. | Video inpainting (Runway Aleph, Kling, Pika). |

### Utility workflows

| Workflow | Summary | Model needs |
|----------|---------|-------------|
| **Re-style / Lip-sync** | Change style or add speech on existing footage. Character sheet optional; backdrop is the video itself. | Video-to-video editing and/or lip-sync (Runway, Wan 2.7, Kling, HeyGen). |





1. Configure any supported provider with your API key
2. Set it as the default in Settings
3. Set up the shot with the VideoGen app interface.
4. Hit Generate — it routes to that provider's adapter with your key

VideoGen is intents to make use of traditional filmmaking
terminology in the UI, such as shot Field Size (e.g. MCU -> 
medium close-up) and Camera Movements (tilt, pan, dolly, tracking).  
It will expand into other AI modalities in the future, such 
as image generation so that the user can generate images
in a separate use interface, save them to the media library, 
and then bring those into the video generation section.

There are many AI service providers providing many different
video models and features.  Some offer features besides just 
text-to-video, such as driving a still character with 
a reference motion or taking a character image and placing
it into the motion.

For now it is just supposed to be a flexible tool suite to 
for generating several clips at a time that carry the 
same scene, camera and lighting settings, and character references 
for testing out models of different kinds from different providers.
as well as APIs that have specialized purposes.

The eventual goal of this is to make it so that the user can
craft shots in a workflow with a variety of custom settings.


--------

Framing

This is the default blocking / composition guide. It renders locally with no API call:

• Layers your Subject and Backdrop reference images (stock cutouts or uploaded refs)
• Positions the subject using your placement grid, field size, headroom, and camera angle
• Shows composition overlays (rule of thirds, etc.) when that mode is on

It updates live as you change camera settings. The bottom bar calls this out: "Blocking preview shows framing only."

Model

This is meant to show an AI-generated preview still — a single image from your image provider (xAI, OpenAI, or Replicate) that approximates what a full video generation might look like, using your assembled prompt and references.




## Reference slots

Use the **Shot breakdown** toggle above the reference slots to switch modes.

### Shot breakdown on (default)

Slots are labeled **Subject**, **Backdrop**, and **Style** (click a label to cycle roles). Preview composites subject over backdrop; prompt assembly treats them like a shot breakdown.

With Subject + Backdrop attached and no @ mentions, the assembled prompt prepends:

• `<IMAGE_1>` = subject (identity only, ignore its background)
• `<IMAGE_2>` = backdrop / environment / lighting palette

**No @ mentions:** Subject → `<IMAGE_1>`, Backdrop → `<IMAGE_2>`. Style (slot 3) is sent but not auto-described — say what it’s for in the prompt or use **@Image3**.

**With @ mentions:** you control bindings; we skip the automatic reference prefix.

**Caveat:** auto defaults assume Subject in slot 1 and Backdrop in slot 2. If you reorder roles, use **@ImageN** so text matches slot order.

### Shot breakdown off

Slots are plain **Image 1 / Image 2 / Image 3** — like generic reference slots on other services. No role cycling, no automatic Subject/Backdrop prefix, and preview shows the first attached image (framing guides still apply).

Describe each image in your prompt or use **@Image1** / **@Image2** / **@Image3** (slot-indexed; on generate they become `<IMAGE_1>`, `<IMAGE_2>`, etc.).

