'use client';

import { getProviderLogoUrl } from '@/lib/constants/provider-logos';

interface ProviderIconProps {
  providerId?: string;
  fallbackIcon?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const SIZE_CLASSES = {
  xs: { box: 'w-6 h-6', emoji: 'text-sm', padding: 'p-0.5' },
  sm: { box: 'w-9 h-9', emoji: 'text-2xl', padding: 'p-1.5' },
  md: { box: 'w-11 h-11', emoji: 'text-3xl', padding: 'p-2' },
} as const;

export function ProviderIcon({
  providerId,
  fallbackIcon = '🔌',
  size = 'md',
  className = '',
}: ProviderIconProps) {
  const logoUrl = providerId ? getProviderLogoUrl(providerId) : undefined;
  const { box, emoji, padding } = SIZE_CLASSES[size];

  return (
    <div
      className={`${box} flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-white/5 overflow-hidden bg-black ${className}`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className={`w-full h-full object-contain ${padding}`}
        />
      ) : (
        <span className={emoji} aria-hidden>
          {fallbackIcon}
        </span>
      )}
    </div>
  );
}
