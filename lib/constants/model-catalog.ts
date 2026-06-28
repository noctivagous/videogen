import type { ModelSlotConfig } from '@/lib/types/studio';

export const MODEL_CATEGORY_DEFINITIONS = [
  { id: 'mask-inpaint', label: 'Mask inpaint', description: 'Regenerate masked regions for Bake Pass 1 while preserving the rest of the frame.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'image-edit', label: 'Image edit', description: 'Prompt-based full image edit fallback when mask inpainting is unavailable.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'multi-image-identity-edit', label: 'Multi-image identity edit', description: 'Apply character sheet identity in Bake Pass 2 without changing composition.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'text-to-image', label: 'Text to image', description: 'Generate still images from text prompts for previews and character sheets.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'image-to-image', label: 'Image to image', description: 'Transform existing images for style or palette changes while preserving structure.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'text-to-video', label: 'Text to video', description: 'Generate a video directly from prompt text, typically for b-roll.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'image-to-video', label: 'Image to video', description: 'Animate a baked or uploaded start frame into a video clip.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'reference-to-video', label: 'Reference to video', description: 'Use multiple image or video references as generation ingredients.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'first-last-frame', label: 'First and last frame', description: 'Interpolate between a start and ending frame for controlled transitions.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-extension', label: 'Video extension', description: 'Continue an existing clip into the next beat with coherent identity and motion.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'camera-control', label: 'Camera control', description: 'Apply promptable camera moves like dolly, crane, and orbit over scene content.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'motion-transfer', label: 'Motion transfer', description: 'Transfer motion from a reference performance into newly generated output.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'multi-shot', label: 'Multi-shot sequence', description: 'Generate a connected set of shots from one narrative prompt.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-edit', label: 'Video edit', description: 'Apply prompt-based style or content edits to existing footage.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-inpaint', label: 'Video inpaint', description: 'Mask and regenerate regions in video with temporal consistency.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'lip-sync', label: 'Lip sync', description: 'Sync a generated or uploaded clip to speech audio as a finishing step.', sourceDoc: 'project-plans/APP-SHAPE.md' },
  { id: 'pose-estimation', label: 'Pose estimation', description: 'Estimate mannequin-ready human pose from a still image.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'control-reference', label: 'Control reference', description: 'Use depth/canny/skeleton guides as structural control signals.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'text-to-speech', label: 'Text to speech', description: 'Convert dialogue script lines into reusable audio tracks.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'speech-to-text', label: 'Speech to text', description: 'Transcribe generated or uploaded audio for captions and validation.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'llm', label: 'LLM prompt assist', description: 'Support shot breakdown and prompt refinement with language models.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-matting', label: 'Video matting', description: 'Extract alpha mattes for compositing multi-layer generated footage.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-compositing-inpaint', label: 'Video compositing inpaint', description: 'Clean seams and blend boundaries in composited video layers.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-compositing-generative', label: 'Video compositing generative', description: 'Perform higher-order generative merge passes for layered composites.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'image-upscale', label: 'Image upscale', description: 'Increase still-image resolution with minimal restyling.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-upscale', label: 'Video upscale', description: 'Increase generated clip resolution for delivery quality.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'frame-interpolation', label: 'Frame interpolation', description: 'Generate intermediate frames to smooth motion or boost FPS.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'image-segmentation', label: 'Image segmentation', description: 'Generate object masks from still images for bake and ref prep.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-segmentation', label: 'Video segmentation', description: 'Track segmentation masks over time for video edit pipelines.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'image-background-removal', label: 'Image background removal', description: 'Cut out foreground subjects from still references.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'voice-cloning', label: 'Voice cloning', description: 'Create stable character voices from reference audio samples.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'character-replace', label: 'Character replace', description: 'Replace people in reference videos with target character identity.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'audio-separation', label: 'Audio separation', description: 'Split mixed audio into stems for lip-sync and dialogue workflows.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'image-outpaint', label: 'Image outpaint', description: 'Expand still-image canvas boundaries while matching scene context.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'video-to-audio', label: 'Video to audio', description: 'Generate Foley and ambience from silent or low-audio clips.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
  { id: 'depth-estimation', label: 'Depth estimation', description: 'Produce depth maps for control-reference conditioning workflows.', sourceDoc: 'project-plans/MODEL-CATALOG.md' },
] as const;

export type ModelCategoryId = (typeof MODEL_CATEGORY_DEFINITIONS)[number]['id'];
export type ProviderCategoryMatrixRow = { categoryId: ModelCategoryId; categoryLabel: string; supported: boolean; defaultModelId: string | null; sourceDoc: string };

export const PROVIDER_SUPPORTED_CATEGORIES: Record<string, ModelCategoryId[]> = {
  replicate: ['mask-inpaint', 'image-edit', 'multi-image-identity-edit', 'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video', 'reference-to-video', 'first-last-frame', 'video-extension', 'motion-transfer', 'video-edit', 'video-inpaint', 'lip-sync', 'control-reference', 'text-to-speech', 'speech-to-text', 'llm', 'video-matting', 'video-compositing-inpaint', 'image-upscale', 'video-upscale', 'frame-interpolation', 'image-segmentation', 'video-segmentation', 'image-background-removal', 'voice-cloning', 'character-replace', 'audio-separation', 'image-outpaint', 'video-to-audio', 'depth-estimation'],
  fal: ['mask-inpaint', 'image-edit', 'multi-image-identity-edit', 'text-to-image', 'image-to-image', 'text-to-video', 'image-to-video', 'reference-to-video', 'first-last-frame', 'video-extension', 'camera-control', 'motion-transfer', 'multi-shot', 'video-edit', 'video-inpaint', 'lip-sync', 'pose-estimation', 'control-reference', 'text-to-speech', 'video-matting', 'video-compositing-inpaint', 'video-compositing-generative', 'image-upscale', 'video-upscale', 'frame-interpolation', 'image-segmentation', 'video-segmentation', 'image-background-removal', 'character-replace', 'audio-separation', 'image-outpaint', 'video-to-audio', 'depth-estimation'],
  xai: ['image-edit', 'multi-image-identity-edit', 'text-to-image', 'text-to-video', 'image-to-video', 'reference-to-video', 'llm'],
  kling: ['text-to-video', 'image-to-video', 'reference-to-video', 'first-last-frame', 'camera-control', 'motion-transfer', 'multi-shot', 'video-edit', 'video-inpaint', 'lip-sync'],
  runway: ['text-to-video', 'image-to-video', 'first-last-frame', 'camera-control', 'motion-transfer', 'video-edit', 'video-inpaint', 'video-compositing-inpaint', 'video-compositing-generative', 'video-upscale'],
  luma: ['text-to-video', 'image-to-video', 'camera-control'],
  viggle: ['image-to-video', 'motion-transfer', 'character-replace'],
  openai: ['image-edit', 'text-to-image', 'text-to-speech', 'speech-to-text', 'llm', 'image-outpaint'],
};

export const PROVIDER_DEFAULT_MODEL_MAP: Record<string, Partial<Record<ModelCategoryId, string>>> = {
  replicate: { 'mask-inpaint': 'black-forest-labs/flux-fill-pro', 'text-to-video': 'bytedance/seedance-2.0', 'reference-to-video': 'bytedance/seedance-2.0', 'video-edit': 'wan-video/wan-2.7-videoedit', 'image-upscale': 'nightmareai/real-esrgan', 'video-upscale': 'bytedance/video-upscaler', 'frame-interpolation': 'google-research/frame-interpolation', 'image-segmentation': 'meta/sam-2', 'video-segmentation': 'meta/sam-2-video', 'image-background-removal': 'cjwbw/rembg', 'voice-cloning': 'minimax/voice-cloning', 'audio-separation': 'ryan5453/demucs', 'depth-estimation': 'depth-anything-v2' },
  fal: { 'mask-inpaint': 'fal-ai/flux-pro/v1/fill', 'image-edit': 'fal-ai/flux-kontext-lora', 'multi-image-identity-edit': 'fal-ai/flux-kontext-lora/inpaint', 'image-to-video': 'fal-ai/kling-video/v2.1/master/image-to-video', 'pose-estimation': 'fal-ai/4d-humans', 'character-replace': 'fal-ai/wan-2.2-animate/replace', 'video-to-audio': 'fal-ai/mmaudio-v2' },
  xai: { 'image-edit': 'grok-imagine-image-quality', 'multi-image-identity-edit': 'grok-imagine-image-quality', 'text-to-image': 'grok-imagine-image-quality', 'text-to-video': 'grok-imagine-video-1.5', 'image-to-video': 'grok-imagine-video-1.5' },
  kling: { 'text-to-video': 'kling-v3', 'image-to-video': 'kling-v3', 'multi-shot': 'kling-v3-omni', 'lip-sync': 'kling-lip-sync' },
  runway: { 'video-edit': 'gen4-video-edit', 'video-inpaint': 'gen4-video-inpaint', 'video-compositing-generative': 'aleph' },
  viggle: { 'motion-transfer': 'viggle-mix-motion-v1', 'character-replace': 'viggle-character-swap-v1' },
};

export const FEATURE_CHECKLIST_ITEMS: Array<{ id: string; title: string; description: string; categories: ModelCategoryId[]; providers: Array<{ id: string; label: string }> }> = [
  { id: 'bake-start-frame', title: 'Bake Start Frame (Pass 1 + Pass 2)', description: 'When you pose the mannequins and other objects in the scene, the workflow will use mask inpaint or image edit AI models to replace the mannequins with the characters from your character sheets.', categories: ['mask-inpaint', 'image-edit', 'multi-image-identity-edit'], providers: [{ id: 'replicate', label: 'Replicate' }, { id: 'fal', label: 'fal.ai' }, { id: 'xai', label: 'xAI' }] },
  { id: 'mannequin-pose-match', title: '3D mannequin pose matching', description: 'You may want to drop an image of someone posing on the mannequin and this kind of model will convert the image to a 3D pose and apply it to the mannequin.', categories: ['pose-estimation'], providers: [{ id: 'fal', label: 'fal.ai' }, { id: 'replicate', label: 'Replicate' }] },
  { id: 'video-generation', title: 'Video generation from baked frame', description: 'In short, these models generate video.\n\nText-to-Video: Generates video entirely from a text description. It builds scenes from scratch ("blank canvas"), allowing for high creative freedom but often lacking consistency across multiple shots.\n\nImage-to-Video: Animates a single static image. The visual identity is locked in, but the motion is usually limited to that specific frame or simple transitions.\n\nReference-to-Video: A hybrid approach that uses multiple reference images (or videos) alongside text prompts to generate consistent, multi-shot videos. It bridges the gap between the creative freedom of text and the visual consistency of images.', categories: ['image-to-video', 'text-to-video', 'reference-to-video'], providers: [{ id: 'xai', label: 'xAI' }, { id: 'replicate', label: 'Replicate' }, { id: 'fal', label: 'fal.ai' }, { id: 'kling', label: 'Kling' }, { id: 'runway', label: 'Runway' }, { id: 'luma', label: 'Luma' }] },
  { id: 'motion-transfer-performance', title: 'Motion transfer performance', description: 'These are specialized AI architectures designed to extract movement data from a "driving" video and apply it to a static "source" image or character.', categories: ['motion-transfer'], providers: [{ id: 'viggle', label: 'Viggle' }, { id: 'kling', label: 'Kling' }, { id: 'fal', label: 'fal.ai' }] },
  { id: 'dialogue-audio', title: 'Dialogue audio path', description: '', categories: ['lip-sync', 'text-to-speech', 'voice-cloning'], providers: [{ id: 'kling', label: 'Kling' }, { id: 'replicate', label: 'Replicate' }, { id: 'fal', label: 'fal.ai' }, { id: 'openai', label: 'OpenAI' }, { id: 'xai', label: 'xAI' }] },
];

export const DEFAULT_MODEL_SLOTS: Record<ModelCategoryId, ModelSlotConfig> = {
  'mask-inpaint': { categoryId: 'mask-inpaint', providerId: 'replicate', modelId: 'black-forest-labs/flux-fill-pro', status: 'implemented' },
  'image-edit': { categoryId: 'image-edit', providerId: 'xai', modelId: 'grok-imagine-image-quality', status: 'implemented' },
  'multi-image-identity-edit': { categoryId: 'multi-image-identity-edit', providerId: 'xai', modelId: 'grok-imagine-image-quality', status: 'partial' },
  'text-to-image': { categoryId: 'text-to-image', providerId: 'xai', modelId: 'grok-imagine-image-quality', status: 'partial' },
  'image-to-image': { categoryId: 'image-to-image', providerId: 'fal', modelId: 'fal-ai/flux-kontext-lora', status: 'partial' },
  'text-to-video': { categoryId: 'text-to-video', providerId: 'replicate', modelId: 'bytedance/seedance-2.0', status: 'partial' },
  'image-to-video': { categoryId: 'image-to-video', providerId: 'xai', modelId: 'grok-imagine-video-1.5', status: 'implemented' },
  'reference-to-video': { categoryId: 'reference-to-video', providerId: 'replicate', modelId: 'bytedance/seedance-2.0', status: 'planned' },
  'first-last-frame': { categoryId: 'first-last-frame', providerId: 'replicate', modelId: 'google/veo-3.1', status: 'planned' },
  'video-extension': { categoryId: 'video-extension', providerId: 'replicate', modelId: 'bytedance/seedance-2.0', status: 'planned' },
  'camera-control': { categoryId: 'camera-control', providerId: 'kling', modelId: 'kling-v3', status: 'planned' },
  'motion-transfer': { categoryId: 'motion-transfer', providerId: 'kling', modelId: 'kling-motion-control', status: 'planned' },
  'multi-shot': { categoryId: 'multi-shot', providerId: 'kling', modelId: 'kling-v3-omni', status: 'planned' },
  'video-edit': { categoryId: 'video-edit', providerId: 'replicate', modelId: 'wan-video/wan-2.7-videoedit', status: 'planned' },
  'video-inpaint': { categoryId: 'video-inpaint', providerId: 'runway', modelId: 'gen4-video-inpaint', status: 'planned' },
  'lip-sync': { categoryId: 'lip-sync', providerId: 'kling', modelId: 'kling-lip-sync', status: 'partial' },
  'pose-estimation': { categoryId: 'pose-estimation', providerId: 'fal', modelId: 'fal-ai/4d-humans', status: 'planned' },
  'control-reference': { categoryId: 'control-reference', providerId: 'fal', modelId: 'fal-ai/controlnet-stack', status: 'planned' },
  'text-to-speech': { categoryId: 'text-to-speech', providerId: 'replicate', modelId: 'elevenlabs/tts', status: 'planned' },
  'speech-to-text': { categoryId: 'speech-to-text', providerId: 'openai', modelId: 'whisper-1', status: 'planned' },
  'llm': { categoryId: 'llm', providerId: 'xai', modelId: 'grok-4', status: 'partial' },
  'video-matting': { categoryId: 'video-matting', providerId: 'replicate', modelId: 'robust-video-matting', status: 'planned' },
  'video-compositing-inpaint': { categoryId: 'video-compositing-inpaint', providerId: 'runway', modelId: 'gen4-video-inpaint', status: 'planned' },
  'video-compositing-generative': { categoryId: 'video-compositing-generative', providerId: 'runway', modelId: 'aleph', status: 'planned' },
  'image-upscale': { categoryId: 'image-upscale', providerId: 'replicate', modelId: 'nightmareai/real-esrgan', status: 'planned' },
  'video-upscale': { categoryId: 'video-upscale', providerId: 'replicate', modelId: 'bytedance/video-upscaler', status: 'planned' },
  'frame-interpolation': { categoryId: 'frame-interpolation', providerId: 'replicate', modelId: 'google-research/frame-interpolation', status: 'planned' },
  'image-segmentation': { categoryId: 'image-segmentation', providerId: 'replicate', modelId: 'meta/sam-2', status: 'planned' },
  'video-segmentation': { categoryId: 'video-segmentation', providerId: 'replicate', modelId: 'meta/sam-2-video', status: 'planned' },
  'image-background-removal': { categoryId: 'image-background-removal', providerId: 'replicate', modelId: 'cjwbw/rembg', status: 'planned' },
  'voice-cloning': { categoryId: 'voice-cloning', providerId: 'replicate', modelId: 'minimax/voice-cloning', status: 'planned' },
  'character-replace': { categoryId: 'character-replace', providerId: 'fal', modelId: 'fal-ai/wan-2.2-animate/replace', status: 'planned' },
  'audio-separation': { categoryId: 'audio-separation', providerId: 'replicate', modelId: 'ryan5453/demucs', status: 'planned' },
  'image-outpaint': { categoryId: 'image-outpaint', providerId: 'replicate', modelId: 'black-forest-labs/flux-fill-pro', status: 'planned' },
  'video-to-audio': { categoryId: 'video-to-audio', providerId: 'fal', modelId: 'fal-ai/mmaudio-v2', status: 'planned' },
  'depth-estimation': { categoryId: 'depth-estimation', providerId: 'replicate', modelId: 'depth-anything-v2', status: 'planned' },
};

export function getProviderCategoryMatrix(providerId: string): ProviderCategoryMatrixRow[] {
  const supported = new Set(PROVIDER_SUPPORTED_CATEGORIES[providerId] ?? []);
  const providerModels = PROVIDER_DEFAULT_MODEL_MAP[providerId] ?? {};
  return MODEL_CATEGORY_DEFINITIONS.map((definition) => {
    const defaultSlot = DEFAULT_MODEL_SLOTS[definition.id];
    const fallbackModel = defaultSlot.providerId === providerId ? defaultSlot.modelId : null;
    return {
      categoryId: definition.id,
      categoryLabel: definition.label,
      supported: supported.has(definition.id),
      defaultModelId: providerModels[definition.id] ?? fallbackModel,
      sourceDoc: definition.sourceDoc,
    };
  });
}

export function providerSettingsPath(providerId: string): string {
  return `/studio/settings/ai/provider/${encodeURIComponent(providerId)}`;
}

export function labSettingsPath(labId: string): string {
  return `/studio/settings/ai/lab/${encodeURIComponent(labId)}`;
}

export function categorySettingsPath(categoryId: ModelCategoryId): string {
  return `/studio/settings/ai/category/${encodeURIComponent(categoryId)}`;
}

export function checklistSettingsPath(checklistId: string): string {
  return `/studio/settings/ai/checklist/${encodeURIComponent(checklistId)}`;
}
