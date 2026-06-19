FUTURE FEATURES


We want to make a new dropdown menu control
and it will be taller than a line of text for the item's
title and accommodate the associated image, such
as for Field Size.  The dropdown menu will not
use the system dropdown menu system but instead be
custom for different views of its contents, such
as grid contents with multiple columns.  
For Field Size, when the dropdown opens it shows
thumbnails and labels for all of the associated
field seizes. If the user selects MS - Medium Shot,
the idle state of the dropdown menu is tall enough
to show a thumbnail aligned right in the background
while the label is centered vertically.  The dropdown
control will have different parameters so that it can
be sized small, medium, large for different thumbnails
and backgrounds.  Some dropdown menu buttons 
will not show a thumbnail but instead a background
image for the entire button background, 
such as "Night", "Afternoon" and they won't need
to be as tall, but their dropdown menu may be
multi-column.  The width and height of the cells
in the multi-column dropdown can be configured controls.


- Add a collapse control to Shot List so that it
collapses into a title bar and then the rest of the UI
makes use of the additional space.  By default make it
collapsed.

- We need to think about how to compact the UI.


REFINEMENT

symbols, images, icons
- show provider logo in header bar in modality.
- show small SVG that represents the frame
for the aspect ratio, inside the dropdown menu
- generate images with AI for the background
of all dropdown settings, such as "Night",
"Afternoon", "Foggy", camera movement: pan, truck,
dolly.


- For Atmosphere and SFX, we will want to be
able to customize the setting further with
a text box underneath the setting or parameters.

- Load the xAI documentation MCP server into
Grok Build and use it to build out features
that make use of xAI's API.
- Shot Breakdown should have a modal because
xAI's image and video models allow more than
3 references.


NOTES

There are some advantages to have this
UI over the stock consumer web app interface
provided by an AI vendor because just
by selecting "foggy," it added fog
and enhanced the output and I would 
not have done that myself in any empty
prompt text area.  This implies also
that we can enhance and go beyond the
conventional text prompt area, such as
providing helpers around it that insert
complex text for issues the user might
not consider or would ensure that the
output is what the user wants.

prompt setting helper button next to
prompt, inserts text after helper modal is completed:

 character starting position:
 	facing direction: [away from camera, etc.]
 	pose: [walking, etc.]
 	expression: [neutral]
 	interacting with object: [e.g. staircase]
 	beginning of video:
 	end of video:
 	

Should we make Characters Activity a separate
prompt text box?  We would split "Shot Activity"
into "General" and "Characters Activity" in the
same section.

 	
 	
We wil be doing things with this app
and tying assets (image references) together
in a way potentially the other apps don't,
for the functionality of our UI and the convenience
of the user.  
Being able to specify the
exactly position the subject
is in in the frame with the "3x3 positions"
is the kind of feature that will make the difference
to provide the user control over
the filmmaking because, as in this example, the positions
are converted into language for the
API payload prompt that would be tedious to type
out and describe.  Such a setup is what allows
for cinematographic control like
classic cinema, where the person can
easily, with a gui control, put the
subject on an edge of the frame.

Because this is powerful, we want to
extend this into a fuller set of features
What we'd like to do is, above the "CAMERA" section header, 
produce the preview frame with the mannequins.
We'll have to build this out to be flexible
since it will be an additive representation
of all of the settings.



---------

- Character sheet generator
	- uses character sheet template

- Variable image reference GUI control
has table view, larger modal editor,
allows adding up to 7 references as
allowed by the model.

- Possible OpenPose-to-mannequin.


---------

Project Color Palettes - for changing the colors
of images and also generating images and videos
with a color palette as guidance.  Color Wheel

----------

Media Library - lets the user browse images
stored for the project.  Is a starting place
for taking an image in the media library
and changing it with AI, such as color palette
or image contents.

Image Composer - multiplexer UI that allows
for search for image assets (with API keys
for various image websites) and then saving
generated results to the Media Library

Image Editor allows treating backdrop or another individual
image as collection so that the backdrop
can be edited with AI in an AI editor modal
and there can be different variations
swapped in the reference images that are tied to 
the original image in the project data.
