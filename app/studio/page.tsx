'use client';

import dynamic from 'next/dynamic';

const StudioShell = dynamic(
  () => import('@/components/studio/StudioShell').then((mod) => mod.StudioShell),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen bg-surface-900 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading studio…</div>
      </div>
    ),
  },
);

export default function StudioPage() {
  return <StudioShell />;
}
