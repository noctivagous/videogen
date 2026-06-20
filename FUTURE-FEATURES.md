FUTURE FEATURES


#studio-preview-frame - the preview frame

---------

Pure text modifiers often give inconsistent or 
subtle results across motion and different models.

---------

App will be founded on model workflows for production
of shots.

SHOT WORKFLOWS - workflow dropdown button
	1) Manual - no UI driven conveniences, just image
	reference slots, prompt slots.
	
	2) Backdrop without Character(s)
		requires: character / subject sheet
		- Treats Image1 as the backdrop, Image2 as 
		subject 1.
		- Character sheet is what the prompt
		drives.
		
		
	3) Place Character(s) into Backdrop
		requires: character / subject sheet
		- Character sheet is used to pre-generate
		the character in the backdrop in the app 
		with an image model, and then the 
		character sheet image is included
		in the AI video model payload to inform
		movements.  That is, Image1 is
		the backdrop + character(s) already provided
		in a single image.
		Other image reference slots are to inform
		with character sheets and other information.
		
		(may optionally work with 
		image2video since it prepares
		the starting image.)
		
	4) others: start frame and end frame.
	
	5) Start with image, image2video
	
	6) Motion transfer (e.g. Viggle)



FEATURE:
Insert character into backdrop according to framing
and composition settings, which means make Image1
a generated frame from an image model of the character
from the character sheet, then submit to AI model with 
character sheet so that the model animates the character
correctly starting with the exact position.

vs. initial mode: 
backdrop with no character in it.
backdrop with character in it based on character sheet.
	- backdrop + subject + prompt -> new backdrop
	with character(s) placed in scene ahead of time,
	then character sheet to guide.

---------

	Image Editor: 
		procedural: flip horizontally, apply filter, color.
		AI: add object, remove object, etc.
		
---------

Remove the purple from the GUI since it distracts
from color grading.  Replace with prosumer shading.

---------

Image editor AI features: 1) object removal  2) object cleanup
3) object addition  4) image synthesis (new image by combining
with one or more other images).

---------

The user should be able to right-click on any
image reference and open it in an image editor
and then changes.

---------
As soon as the user locks the backdrop, a progress indicator circle starts rotating over the lock, a background process should start that crops it, puts a checkmark over the lock when it is finished, and then that is what is shown in the studio-preview-frame (no longer any excess).  If the user unlocks it, the editing mode of the backdrop is shown again.  2) If the user doesn't lock the backdrop, the crop will be generated with existing conditions just before video generation and image preview generation but won't lock it (a stored crop).  Until a backdrop is locked, it can be moved around but it should be moved around with handles on all of the corners when it has been selected and clicking outside of it will deselect the backdrop.  This also means that we can have other transforms applied to the backdrop in relation to the frame, such as shear, rotation, skew, and perspective.  


If the backdrop image reference is bigger or smaller than the
aspect ratio of the frame in any dimension, this can be shown
in the studio-preview-panel area, with the excess that goes
outside the frame being lighter. The backdrop can then be 
moved around and scaled.  If it is too small,
the app will scale it up, better if with an embedded
scaling model that comes with the app.  The user will be
able to lock and unlock the backdrop position and scaling
for the preview frame in the studio-preview-panel area.

Crop operations that fit the provided image to the aspect ratio exactly
will store a second version, the cropped version for the aspect ratio 
for this job and submit that to the
AI model instead of the provided image.  This way
a user can use an image that isn't a perfect fit, adjust
its translation and scaling, and then the image sent to
the model is exactly what is seen inside the preview frame bounds.  
Another benefit is that the same image can be positioned and scaled for different
aspect ratios and as the user switches between them,
any translation or scaling that was done will have been
saved and loaded for that aspect ratio.  What this allows
is the user can try out generating a shot in different
aspect ratios with the same provided original backdrop image reference.


The user should have an option to finalize the crop.  

---------

Theme Transformer should be a floating palette inside
the studio-preview area because it is acting
as a group of settings for a transformation operation
on a an image rather than settings for the shot.
It can be called Image Transformer instead to avoid
confusion.  Then disconnect the "Stale" tracking
for this and the user can generate multiple variations
on the same image reference with the Image Transformer 
floating palette.

---------

VIDEOGEN APP SHAPE

App should be shaped in the following way: "Light your
backdrop reference first, then describe the lighting
technique and atmosphere, and effects you want the AI to
apply on top."

"Make your character sheet (with our tools) and include it"

This respects how the models actually work (strong
references + descriptive direction) while giving users a
filmmaking-like mental model.

---------

In the "Look Library" we don't want any genre specific terms
like "Detective Noir" or "Nordic Noir".  In place of
"Detective Noir" we would have technique-based terms like
Chiaroscuro B&W then have a film grain setting in the look
library.  That way the user can construct "Detective Noir"
if he wants but it doesn't end up being a cookie cutter set
of selections.


---------

Image Editor

The image references that the user provides may not be ready
and may need image processing, so in addition to the current
Image Transformer we can have an image editor.

---------

-----

It might be helpful to have the AI analyze the provided
image references for what they contain. But at the same
time, the image references may not be ready and need AI
work. In real world filmmaking, the set isn't usually lit
and there is an actual application of lighting to the set.


Core concept: Before generation, run a lightweight vision
analysis on the uploaded Subject, Backdrop, and Style
references. Extract key lighting information and use it to:

Suggest or auto-apply improvements. Inform the prompt with
accurate descriptions. Guide users on technique choices.

---

But the way the AI models work, you are often bringing in a
pre-lit backdrop image reference and the AI can add
atmospheric effects.

Real-World Filmmaking

The set is built and then lit on location (or on stage) with
practical lights, motivated sources, gels, flags, bounces,
etc. Lighting is additive and interactive — it responds to
the physical environment, actors, and camera movement in
real time. The cinematographer shapes light dynamically
during the shoot.

AI Video Generation (current reality)

You typically provide pre-lit or pre-styled references
(Backdrop, Subject, Style). The model then composites and
enhances based on the prompt (adding fog, god rays, mood,
etc.). The AI is good at atmospheric overlays and global
grading, but less precise at complex interactive lighting
simulation from scratch.



---------

We want our app technique-oriented, not preset oriented.

Example: chiaroscuro (technique) vs. noir (genre)

---------

Theme transformer can still guide the generation of the
video.

---------

pre-processing of image references vs. prompt text for the
video.

----------

1. The color palette table is the table that will transform
the provided image references, so it should include any
"Look Library" setting in it and it can be called "Theme
Transformer".

We need to remove the current setup where we are trying to
get prompts to change the video. Text prompts alone have
relatively weak influence on precise color grading,
palettes, or filmic looks in video models. The models
prioritize subject, motion, and composition first. Explicit
color instructions (“teal and orange complementary palette,
cinematic color grading”) help somewhat but often produce
inconsistent or subtle results, especially across frames.
color palette control is much stronger via reference images
(subject + style) than text prompts alone.

Pre-colorized assets win — Generate or edit your Subject /
Backdrop / Style references with the color palette and Look
Library settings, lighting, and film look before feeding
them into the video model. This is the dominant workflow.

We will rework the app so it applies color palette and look
library settings to the user’s assets (before generation) so
that it aligns with how the most effective AI video
workflows work today.

Recommended Implementation Flow

User uploads assets (Subject, Backdrop, Style reference)
User selects color palette / mood / film look in the UI
(color wheel + schemes, presets, film stock emulation).

App processes the assets client-side or via a lightweight
server step: Apply color grading, saturation, temperature,
and filmic effects to the images OR, which will happen for
the look library setting use the currently selected image
model to make modifications.  The modifications will sit
underneath the "Shot References" as "Transformed References"
and if "Look Library" or "Color Palette" are turned off this
will be turned off too.

Generate or modify a style reference that embodies the
chosen look.

Send the processed (pre-colored) assets + reinforced prompt
to the video model.

This gives the model the strong visual anchors in the image
refs instead of relying on text descriptions.

The Look Library and Color Palette section in the UI can be
grouped under "Theme Transformer"



if put it above the color palette table. put an arrow
pointing down to the color palette table. the color palette
table should have a button, ""

but some kind of logic can be applied to the situation
depending on how the user is using this widget it will adapt


2. in the frame preview area, the AI will use the color
palette and effects setting and before generation apply it
to the backdrop and subject image reference slots but will
indicate that it is a generation by putting the new images
underneath with an arrow pointing to them.


---------

We want to make a new dropdown menu control and it will be
taller than a line of text for the item's title and
accommodate the associated image, such as for Field Size. 
The dropdown menu will not use the system dropdown menu
system but instead be custom for different views of its
contents, such as grid contents with multiple columns. For
Field Size, when the dropdown opens it shows thumbnails and
labels for all of the associated field seizes. If the user
selects MS - Medium Shot, the idle state of the dropdown
menu is tall enough to show a thumbnail aligned right in the
background while the label is centered vertically.  The
dropdown control will have different parameters so that it
can be sized small, medium, large for different thumbnails
and backgrounds.  Some dropdown menu buttons will not show a
thumbnail but instead a background image for the entire
button background, such as "Night", "Afternoon" and they
won't need to be as tall, but their dropdown menu may be
multi-column.  The width and height of the cells in the
multi-column dropdown can be configured controls.


- Add a collapse control to Shot List so that it collapses
into a title bar and then the rest of the UI makes use of
the additional space.  By default make it collapsed.

- We need to think about how to compact the UI.


REFINEMENT

symbols, images, icons - show provider logo in header bar in
modality. - show small SVG that represents the frame for the
aspect ratio, inside the dropdown menu - generate images
with AI for the background of all dropdown settings, such as
"Night", "Afternoon", "Foggy", camera movement: pan, truck,
dolly.


- For Atmosphere and SFX, we will want to be able to
customize the setting further with a text box underneath the
setting or parameters.

- Load the xAI documentation MCP server into Grok Build and
use it to build out features that make use of xAI's API. -
Shot Breakdown should have a modal because xAI's image and
video models allow more than 3 references.


NOTES

There are some advantages to have this UI over the stock
consumer web app interface provided by an AI vendor because
just by selecting "foggy," it added fog and enhanced the
output and I would not have done that myself in any empty
prompt text area.  This implies also that we can enhance and
go beyond the conventional text prompt area, such as
providing helpers around it that insert complex text for
issues the user might not consider or would ensure that the
output is what the user wants.

prompt setting helper button next to prompt, inserts text
after helper modal is completed:

 character starting position: facing direction: [away from
 camera, etc.] pose / movement: [walking, etc.] expression:
 [neutral] interacting with env. or object: [e.g. staircase]
 beginning of video: end of video:


Should we make Characters Activity a separate prompt text
box?  We would split "Shot Activity" into "General" and
"Characters Activity" in the same section.



We wil be doing things with this app and tying assets (image
references) together in a way potentially the other apps
don't, for the functionality of our UI and the convenience
of the user. Being able to specify the exactly position the
subject is in in the frame with the "3x3 positions" is the
kind of feature that will make the difference to provide the
user control over the filmmaking because, as in this
example, the positions are converted into language for the
API payload prompt that would be tedious to type out and
describe.  Such a setup is what allows for cinematographic
control like classic cinema, where the person can easily,
with a gui control, put the subject on an edge of the frame.

Because this is powerful, we want to extend this into a
fuller set of features What we'd like to do is, above the
"CAMERA" section header, produce the preview frame with the
mannequins. We'll have to build this out to be flexible
since it will be an additive representation of all of the
settings.



---------

- Character sheet generator - uses character sheet template

- Variable image reference GUI control has table view,
larger modal editor, allows adding up to 7 references as
allowed by the model.

- Possible OpenPose-to-mannequin.


---------

Project Color Palettes - for changing the colors of images
and also generating images and videos with a color palette
as guidance.  Color Wheel

----------

Media Library - lets the user browse images stored for the
project.  Is a starting place for taking an image in the
media library and changing it with AI, such as color palette
or image contents.

Image Composer - multiplexer UI that allows for search for
image assets (with API keys for various image websites) and
then saving generated results to the Media Library

Image Editor allows treating backdrop or another individual
image as collection so that the backdrop can be edited with
AI in an AI editor modal and there can be different
variations swapped in the reference images that are tied to
the original image in the project data.
