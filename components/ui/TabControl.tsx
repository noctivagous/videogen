'use client';

import { PRO_CONTROL } from '@/lib/constants/prosumer-surfaces';
import {
  SegmentedControl,
  type SegmentedControlProps,
} from '@/components/ui/SegmentedControl';

export interface TabControlProps extends SegmentedControlProps {
  /** `id` of the tabpanel this control switches. */
  panelId: string;
}

/** SegmentedControl configured as a tablist bound to a tabpanel. */
export function TabControl({
  panelId,
  className = '',
  role = 'tablist',
  ...props
}: TabControlProps) {
  return (
    <SegmentedControl
      {...props}
      role={role}
      tabPanelId={panelId}
      className={`${PRO_CONTROL.tabControl} ${className}`.trim()}
    />
  );
}