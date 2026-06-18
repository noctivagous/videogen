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
