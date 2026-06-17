import type { AspectRatio } from '@/lib/types/studio';

export interface ResolutionPreset {
  label: string;
  value: string;
}

export const RESOLUTION_PRESETS: Record<AspectRatio, ResolutionPreset[]> = {
  '16:9': [
    { label: '4K', value: '3840x2160' },
    { label: '1080p', value: '1920x1080' },
    { label: '720p', value: '1280x720' },
    { label: '480p', value: '854x480' },
  ],
  '9:16': [
    { label: '4K (Vertical)', value: '2160x3840' },
    { label: '1080p (Vertical)', value: '1080x1920' },
    { label: '720p (Vertical)', value: '720x1280' },
    { label: '480p (Vertical)', value: '480x854' },
  ],
  '1:1': [
    { label: '4K (Square)', value: '2160x2160' },
    { label: '1080p (Square)', value: '1080x1080' },
    { label: '720p (Square)', value: '720x720' },
    { label: '480p (Square)', value: '480x480' },
  ],
  '4:3': [
    { label: '4K (Classic)', value: '2880x2160' },
    { label: '1080p (Classic)', value: '1440x1080' },
    { label: '720p (Classic)', value: '960x720' },
    { label: '480p (Classic)', value: '640x480' },
  ],
  '21:9': [
    { label: '4K (Ultrawide)', value: '3840x1645' },
    { label: '1080p (Ultrawide)', value: '2560x1080' },
    { label: '720p (Ultrawide)', value: '1680x720' },
    { label: '480p (Ultrawide)', value: '1120x480' },
  ],
};