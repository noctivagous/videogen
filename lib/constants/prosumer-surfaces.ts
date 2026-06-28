/**
 * Prosumer material + control class names.
 * Usage guide: project-plans/PROSUMER-MATERIALS.md
 */

/** Non-interactive surface tiers */
export const PRO_SURFACE = {
  /** Flat chrome bands — toolbar, legend tags */
  matte: 'pro-surface-matte',
  /** Recessed wells — fields, readouts, inspector rails */
  inset: 'pro-surface-inset',
  /** Raised base material — shared by buttons/triggers */
  relief: 'pro-surface-relief',
  /** Lifted dark matte on inset rails — header badges, group pickers */
  matteGlass: 'pro-matte-glass',
  /** Recessed tray behind header badge row */
  headerBadgeTray: 'pro-header-badge-tray',
} as const;

/** Interactive controls */
export const PRO_CONTROL = {
  /** Standard raised push button */
  btn: 'pro-btn',
  btnCompact: 'pro-btn pro-btn--compact',
  btnIcon: 'pro-btn pro-btn--icon',
  /** Lower-emphasis relief */
  btnGhost: 'pro-btn pro-btn--ghost-relief',
  /** Launcher / accent wash — pair with inline tint styles */
  btnTint: 'pro-btn pro-btn--tint',
  /** Primary CTA */
  btnBrand: 'pro-btn pro-btn--brand',
  /** Wide dropdown opener */
  trigger: 'pro-trigger',
  /** Floating dropdown panel */
  menu: 'pro-menu',
  menuItem: 'pro-menu-item',
  menuItemActive: 'pro-menu-item pro-menu-item--active',
  menuItemDestructive: 'pro-menu-item pro-menu-item--destructive',
  /** Small floating panel — mentions, previews */
  popover: 'pro-popover',
  /** Flush joined segment strip — no gaps between items */
  segmentedControl: 'segmented-control',
  segmentedControlBtn: 'segmented-control-btn',
  /** Tab strip bound to a tabpanel — active tab merges with panel below */
  tabControl: 'tab-control',
} as const;

/** Labeled control enclosures */
export const PRO_ENCLOSURE = {
  group: 'pro-group',
  groupLabel: 'pro-group-label',
  insetBox: 'pro-inset-box',
  /** Raised section enclosure — non-inset relief */
  reliefBox: 'pro-relief-box',
  /** Panel-tone raised enclosure for side-panel sections */
  reliefBoxDark: 'pro-relief-box pro-relief-box--dark',
  field: 'pro-field',
  fieldRelief: 'pro-field-relief',
  /** Lighter raised field — toolbar launcher chips */
  fieldReliefLevel1: 'pro-field-relief-level-1',
  label: 'pro-label',
  valuePill: 'pro-value-pill',
  pane: 'pro-pane',
  paneTitlebar: 'pro-pane-titlebar',
  paneBody: 'pro-pane-body',
  /** Preview settings bar — backdrop lock relief chip */
  previewBackdropLock: 'preview-backdrop-lock',
} as const;

/** Global prosumer scrollbars are applied via `*` in globals.css (Firefox + WebKit). */
export const PRO_SCROLL = {
  size: '--pro-scroll-size',
  track: '--pro-scroll-track',
} as const;