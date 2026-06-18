FUTURE FEATURES


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


ISSUES

- The "Focal Length" slider should snap to actual
focal lengths, e.g. 70mm and not 71mm.
- The in the upper right of the frame is clipped by the frame

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
