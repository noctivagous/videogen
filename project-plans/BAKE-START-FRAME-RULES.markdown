# tasks-lighting.md

## Rule for Bake Start Frame

1. **Use mm to drive PoseBlock and DOF during bake. That’s where it’s real.**
   - Focal length, sensor, and aperture set the PoseBlock virtual camera FOV and depth of field calculation.
   - DOF is applied as a post-process to the character composite during bake, not to the backdrop plate.
   - Mannequin placement, scale, and frustum guides all derive from mm + sensor settings.

2. **Don’t send mm to the video model.**
   - Video models cannot re-project the baked plate to a new focal length.
   - Send physical camera moves instead: “dolly forward 2m”, “push in 20%”, not “85mm lens”.
   - mm is stored in shot metadata only: `shot.camera_optics.focal_length_mm`, `shot.camera_optics.sensor`. Used for future re-blocking, not for model prompts.

3. **Store mm in the shot metadata so blocking intent is preserved.**
   - When re-opening a project, users should know why the blocking feels telephoto vs wide.
   - Metadata is never passed to image-edit or video models post-bake.

## Lighting is a per-pixel rendering instruction

The backdrop plate is already lit, but the character from your character sheet isn’t. The image-edit model is painting new pixels for the character, and it has no idea what light should hit them unless you tell it. The backdrop’s pixels won’t “light” the character for you.

Image models don’t do global illumination. They can’t look at the bright sky in your plate and infer “so there should be a rim light on the character’s shoulder.” They only see local context where they’re inpainting. If you don’t specify, most models default to flat, frontal, overcast lighting — which is why baked characters often look pasted.

Read the backdrop's light direction (even a manual sun angle picker) and pass it to 
the image-edit model as a prompt token. "Match key light from camera left, 45° elevation." 
That keeps the baked frame from looking pasted.


### What the model needs to answer for every bake:
- Where is the shadow on the face?
- Which side gets rim light?
- How hard/soft are the shadows?
- What color temperature?
- What is the focus distance and aperture for DOF on the character?

Your 2D backdrop doesn’t contain that answer for the character. So you tell the model.

## Two lighting cases for Bake

### 1. Match the backdrop lighting
Goal: Character looks like they were there when the photo was taken.

**Implementation:**
- Sun dial reads the plate: key direction, elevation, quality, time of day.
- Convert to prompt token:  
  `"light the character to match: key from 225° azimuth, 35° elevation, hard sunlight, 
  shadows to camera right, warm afternoon, 4500K"`
- DOF token: `"shallow depth of field, focus at 2.1m, f/2.8, match plate bokeh"`
- The model shades the character to blend. The plate stays untouched.

### 2. Override the backdrop lighting for creative effect
Goal: Add rim light, high-key, or dramatic lighting not present in the plate. Legit technique — DPs use flags/kickers not in the location.

**Implementation:**
- UI toggle: `lighting_mode: "custom"`
- Additional controls: rim light direction, kicker, bounce fill, negative fill.
- Prompt becomes:  
  `"light the character with strong back-rim light from camera rear-right at 315° azimuth, 20° elevation, ignore backdrop lighting for the character, add subtle bounce fill from below at 10% intensity, keep hard key from 225°"`
- Explicitly tell the model to not match if desired. User owns the stylized look.

## What to send the image-edit model during Bake

**Send:**
1. **Lighting tokens**: key azimuth/elevation, quality (hard/soft), color temp, rim/kicker/bounce directions, negative fill.
2. **DOF tokens**: focus distance, f-stop, “match plate bokeh” or “target bokeh radius: 12px”.
3. **Placement tokens**: “place character at mannequin position, respect occlusion”.
4. **Preservation tokens**: “do not modify backdrop pixels except where occluded by character”.

**Do not send:**
1. **Focal length mm**: Perspective is already baked in the plate. mm was used pre-bake in PoseBlock.
2. **Camera moves**: No “dolly” or “pan” — image-edit is a still. Moves go to video model later.
3. **Plate re-lighting**: Don’t ask to change the backdrop’s lighting to match character. Character matches plate, not vice versa.

## Lighting features to build

### Core UI Controls
- **Sun Dial**: azimuth 0-360°, elevation 0-90°. Rotates with plate if user rotates backdrop.
- **Lighting Mode**: `match_plate | custom`
- **Key Quality**: `hard | soft`
- **Color Temp**: 2000K-10000K slider, or “match plate” eyedropper
- **Intensity**: Key/fill ratio slider
- **Rim Light**: Toggle + direction dial, intensity
- **Kicker/Bounce**: Optional secondary light dials
- **Negative Fill**: Toggle + direction for flagging

### Metadata to store per shot
```json
"lighting": {
  "mode": "match_plate",
  "key_azimuth": 225,
  "key_elevation": 35,
  "quality": "hard",
  "color_temp_k": 4500,
  "time_of_day": "late_afternoon",
  "rim_enabled": false,
  "rim_azimuth": null,
  "focus_distance_m": 2.1,
  "f_stop": 2.8,
  "plate_rotation_offset": 0
},
"camera_optics": {
  "focal_length_mm": 50,
  "sensor": "Super35",
  "plate_focal_length_mm": 35
}