<h1>VideoGen</h1>


VideoGen is a workflow-based AI video generation app
centered on shot design. It makes use of 3D mannequins
placed in an orthographic 3D view. The 3D scene is 
composited on top of the user's provided backdrop plate.  
It is under development.


<h2>Pose Mannequins</h2>

Being able to use 3D mannequin models to stage the first frame of an AI-generated video 
has two benefits. First it allows exact blocking of the virtual actors' positions and
gestures to set the mood and composition of the shot at a level 
on par with traditional filmmaking. 

<h3>Different Effects for The Same Frame</h3>

<p> The user will set up a shot by adding mannequins to the scene
and selecting a frame from a pose animation from the included 
database.  That is, the user will scrub through a pose animation
with a slider and choose the desired frame for the start image. 
(The database includes animations for sitting, walking,
running, reclining, etc.)

<p>In addition, the mannequins can be scaled and rotated in all three
directions. They have controls for adjustments to body parts.</p>


<p align="left">
  <em>SOLEMN, FOREGROUND: (Close-up two-shot)</em><br>
  <img src="public/readme/posing-1-closeup-twoshot.png" alt="Posing 1" width="500">
  <br>
  
</p>


<p align="left">
  <em>MORE SOMBER, LOOKING DOWN. Close-up two-shot looking down</em><br>
  <img src="public/readme/posing-2-closeup-twoshot-lookingdown.png" alt="Posing 2" width="500">
  
  
</p>

<p align="left">
  <em>BLOCKING CHANGE: Ledge. (Close-up two-shot)</em><br>
  <img src="public/readme/posing-3-closeup-twoshot-ledge.png" alt="Posing 3" width="500">
  <br>
  
</p>

<p align="left">
  <em>TENSION: Looking Behind. (Long shot, two-shot)</em><br>
  <img src="public/readme/posing-4-longshot-twoshot-lookbehind.png" alt="Posing 4" width="500">
  <br>
  
</p>   


Second it accommodates the software architecture 
of these models. The generative AI video models are essentially next frame predictors
and they are not simulating physics or built with awareness of geometry
of the training data.


VideoGen

The plan is for it to provide multiple gated workflows 
for making shots.

**1. Bake Start Frame** - Baking characters into
a pre-lit backdrop is considered the most reliable
method to produce desired results.  In VideoGen, use mannequins
to block the video frame. VideoGen will then bake composites of your
character(s) from your character sheet(s) into the backdrop,
replacing the mannequins' orientation and location.  
In this workflow, the video model's role is only to add motion to the 
baked image based on your character sheet and prompt.

**2. Auto-place Character** - Send the model your
character sheet(s) + backdrop separately (not fused
as a single baked image), explain where you
want the character to be and the model 
infers scale/position and places your character
into the backdrop.  Optional mannequin blocking,
but no bake step before submitting to video model.  
This provides fast iteration. 


For a given shot, the user can utilize one or more 
workflows to generate media.  The media are available 
in a media library


## Workflows and Mannequin-Based Frame Blocking

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

VideoGen is intends to make use of traditional filmmaking
terminology conveniences in the UI, such as shot Field Size (e.g. MCU -> 
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

The eventual goal of this is to make it so that the user can
craft shots in a workflow with a variety of custom settings.



Describe each image in your prompt or use **@Image1** / **@Image2** / **@Image3** (slot-indexed; on generate they become `<IMAGE_1>`, `<IMAGE_2>`, etc.).

## PoseBlock (3D mannequin compositor)

VideoGen embeds **[PoseBlock](PoseBlock/)** as a git submodule for 3D pose blocking (replacing static PNG mannequins over time). Integration plan: [`PoseBlock/INTEGRATION.md`](PoseBlock/INTEGRATION.md).

```bash
# Fresh clone — include submodule
git clone --recurse-submodules https://github.com/noctivagous/videogen.git
cd videogen
npm install

# Existing clone — init submodule
git submodule update --init --recursive
npm install

# Work on PoseBlock alone
cd PoseBlock && npm install && npm run dev
```

After `npm install`, VideoGen resolves the local package via `"poseblock": "file:./PoseBlock"`. The same install step links PoseBlock's GLB models into `public/poseblock-models` (symlink when possible, copy fallback on Windows). If models 404 after cloning, run `git submodule update --init --recursive` then `npm run setup:poseblock`.

To enable the 3D compositor in the studio preview (instead of PNG mannequins), add to `.env.local`:

```bash
NEXT_PUBLIC_POSEBLOCK_COMPOSITOR=1
```

Restart `npm run dev`, open a shot on **Bake Start Frame** or **Auto-place Character**, and switch the preview to **Framing** mode.

