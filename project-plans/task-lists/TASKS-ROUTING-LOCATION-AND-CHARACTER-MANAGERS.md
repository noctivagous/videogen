
[ ] APP ROUTING

localhost/demo-surfer/shot-designer/setup?item=setup1/shot?item=shot1/workflow=bakeStartFrame
localhost/app/settings


1. shot-designer should have ?setup=&shot=&workflow=&mainTab=preview&previewTab=blocking

2. /studio for when the app panel resides in the
inside the app then /solo to make any panel load
by itself individually.


---

[x]  LOCATION AND CHARACTER MANAGERS

We will have a Location Manager
and a Character Manager.  Right now
we only have Character Manager.

In "Bake Start Frame" and other
workflows, instead of the user
adding Character sheets manually
for the character slot,
the user will add objects with 
the *character* data type and
the requirement for an object
with this data type to be made
is that it has at least one
character sheet and a name.
They will belong to projects
generally.  So if the user 
selects 2S, there will be two
character slots.

So instead of the image slot,
the user will add characters
underneath the "Characters" section
and this will replace the "Character Sheet"

For Location Backdrop Plates,
the situation will be the same,
that there has to be at least
one backdrop plate per Location
and the Location has to have a provided
name.

We want the data that shows up in the 
Media Library to be grouped by
these native data types and not raw
images by themselves.  Standalone
images can exist in the Media Library
database but when they are part of
a character or location object, they
should be grouped underneath them in 
the views.  






