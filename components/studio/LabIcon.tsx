'use client';

import { getBuiltInProviderById } from '@/lib/constants/providers';
import { getLabLogoProviderId } from '@/lib/constants/provider-logos';
import { ProviderIcon } from '@/components/studio/ProviderIcon';
import type { LabDefinition } from '@/lib/types/studio';

interface LabIconProps {
  lab: Pick<LabDefinition, 'id' | 'directProviderId' | 'name'>;
  fallbackIcon?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function LabIcon({
  lab,
  fallbackIcon,
  size = 'md',
  className = '',
}: LabIconProps) {
  const directProvider = lab.directProviderId ? getBuiltInProviderById(lab.directProviderId) : undefined;
  const logoProviderId = getLabLogoProviderId(lab);

  return (
    <ProviderIcon
      providerId={logoProviderId}
      fallbackIcon={fallbackIcon ?? directProvider?.icon ?? lab.name[0]?.toUpperCase() ?? '🔬'}
      size={size}
      className={className}
    />
  );
}