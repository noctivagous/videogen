import { redirect } from 'next/navigation';
import { studioPanelRoute, DEFAULT_STUDIO_PANEL } from '@/lib/studio/studio-routes';

export default function StudioPage() {
  redirect(studioPanelRoute(DEFAULT_STUDIO_PANEL));
}
