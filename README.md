VideoGen

VideoGen is supposed to be a general purpose 
BYOK (Bring Your Own Keys) multi-provider 
video generation app (under development).

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
