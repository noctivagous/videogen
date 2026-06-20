Discussion.

Translating cinematography grammar (LS, 2S, clean/dirty,
eye-level) into machine-readable controls (prompt text).

Abbreviations like LS, MCU, WS show up in film school, not
in training data. The models have seen millions of captions
that say "long shot of a cowboy," not "LS cowboy," so the
full phrase anchors better.

2S / 3S tells the app how many subjects to enforce. That's
useful for Framing preview (position two subjects on the
grid) and for prompt guardrails ("exactly two people, no
extras"). Models tend to add random bystanders unless you
constrain count.

Clean Single / Dirty Single tells the app about foreground
occlusion. A clean single is a solo subject with clear
background. A dirty single is an over-the-shoulder — you
need that blurred shoulder in the foreground for eyeline
continuity.

UI term	What you send to model	What you do in Framing
2S	"two-shot, two people in frame side by side"	place
two subjects, enforce count 3S	"three-shot, three people
in frame"	place three subjects Clean Single	"single
person centered, clean background, no foreground
elements"	solo subject, no overlay Dirty
Single	"over-the-shoulder shot, blurred shoulder of
second person visible in foreground left"	add foreground
shoulder layer, slight blur


For Dirty Single, don't rely on the prompt alone — the model
rarely gets the exact amount of shoulder. Bake it in your
Lock Start Frame workflow, then the video model just holds
the framing.

Keep 2S, 3S, Clean/Dirty in the UI. They're fast for
filmmakers and they map directly to your placement grid.

In theory: give the model a character sheet + a backdrop
cropped to a long-shot framing, and it should respect it.

In practice:

Image-to-video models inherit composition from the start
frame, so a wide crop does bias toward a wide result But
they also reinterpret scale based on the prompt. If you crop
wide and then write "extreme close-up on face," most engines
will push in anyway If you crop tight and write nothing, the
model often pulls back to "show the scene" because it's
trying to be helpful That's why the guides tell you to do
both: master cinematic language like "establishing shot,"
"dolly zoom," "Dutch angle" and give it a clean reference
image

The workflow pros use on Higgsfield and LTX looks like this:

Build character sheet (Soul ID) — locks identity Generate or
crop backdrop to the exact framing you want Composite
character into that backdrop with an image model first —
this becomes your start frame Prompt the video model with
the full shot description: "Long shot, static tripod.
Character stands center frame in desert backdrop. Slow pan
right."

That pre-composite step is why your "Place Character(s) into
Backdrop" workflow is the one people actually use
