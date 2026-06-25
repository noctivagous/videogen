'use client';

import {
  Aperture,
  Clapperboard,
  ImageIcon,
  Library,
  MapPin,
  Palette,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { StudioLauncherItemId } from '@/lib/constants/studio-launcher';

export const STUDIO_LAUNCHER_ICONS: Record<StudioLauncherItemId, LucideIcon> = {
  'shot-designer': Clapperboard,
  'media-library': Library,
  'character-sheet-generator': Users,
  'location-manager': MapPin,
  'film-look-maker': Aperture,
  'color-palette-maker': Palette,
  'image-editor': ImageIcon,
  settings: Settings,
};
