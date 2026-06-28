export type SettingsSection = 'app' | 'project' | 'ai';

export const SETTINGS_SECTIONS: readonly SettingsSection[] = ['app', 'project', 'ai'] as const;

export const DEFAULT_SETTINGS_SECTION: SettingsSection = 'ai';

export function isSettingsSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

export function settingsSectionRoute(section: SettingsSection = DEFAULT_SETTINGS_SECTION): string {
  return `/studio/settings/${section}`;
}

export interface ParsedSettingsPath {
  section: SettingsSection;
  providerDetailId: string | null;
  categoryDetailId: string | null;
  checklistDetailId: string | null;
}

function parseAiDetailPath(rest: string | undefined): Pick<ParsedSettingsPath, 'providerDetailId' | 'categoryDetailId' | 'checklistDetailId'> {
  if (!rest) {
    return { providerDetailId: null, categoryDetailId: null, checklistDetailId: null };
  }

  const providerMatch = rest.match(/^provider\/([^/]+)$/);
  if (providerMatch) {
    return { providerDetailId: decodeURIComponent(providerMatch[1]), categoryDetailId: null, checklistDetailId: null };
  }

  const categoryMatch = rest.match(/^category\/([^/]+)$/);
  if (categoryMatch) {
    return { providerDetailId: null, categoryDetailId: decodeURIComponent(categoryMatch[1]), checklistDetailId: null };
  }

  const checklistMatch = rest.match(/^checklist\/([^/]+)$/);
  if (checklistMatch) {
    return { providerDetailId: null, categoryDetailId: null, checklistDetailId: decodeURIComponent(checklistMatch[1]) };
  }

  return { providerDetailId: null, categoryDetailId: null, checklistDetailId: null };
}

export function parseSettingsPathname(pathname: string): ParsedSettingsPath | null {
  if (pathname === '/studio/settings') {
    return {
      section: DEFAULT_SETTINGS_SECTION,
      providerDetailId: null,
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const legacyProviderMatch = pathname.match(/^\/studio\/settings\/provider\/([^/]+)$/);
  if (legacyProviderMatch) {
    return {
      section: 'ai',
      providerDetailId: decodeURIComponent(legacyProviderMatch[1]),
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const legacyCategoryMatch = pathname.match(/^\/studio\/settings\/category\/([^/]+)$/);
  if (legacyCategoryMatch) {
    return {
      section: 'ai',
      providerDetailId: null,
      categoryDetailId: decodeURIComponent(legacyCategoryMatch[1]),
      checklistDetailId: null,
    };
  }

  const legacyChecklistMatch = pathname.match(/^\/studio\/settings\/checklist\/([^/]+)$/);
  if (legacyChecklistMatch) {
    return {
      section: 'ai',
      providerDetailId: null,
      categoryDetailId: null,
      checklistDetailId: decodeURIComponent(legacyChecklistMatch[1]),
    };
  }

  const sectionMatch = pathname.match(/^\/studio\/settings\/(app|project|ai)(?:\/(.*))?$/);
  if (!sectionMatch) return null;

  const section = sectionMatch[1] as SettingsSection;
  const details = section === 'ai' ? parseAiDetailPath(sectionMatch[2]) : {
    providerDetailId: null,
    categoryDetailId: null,
    checklistDetailId: null,
  };

  return { section, ...details };
}

export function resolveSettingsPathRedirect(pathname: string): string | null {
  if (pathname === '/studio/settings') {
    return settingsSectionRoute(DEFAULT_SETTINGS_SECTION);
  }

  const legacyMatch = pathname.match(/^\/studio\/settings\/(provider|category|checklist)\/(.+)$/);
  if (legacyMatch) {
    return `/studio/settings/ai/${legacyMatch[1]}/${legacyMatch[2]}`;
  }

  return null;
}

export function isValidSettingsPathname(pathname: string): boolean {
  return parseSettingsPathname(pathname) != null;
}

export const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  app: 'App',
  project: 'Project',
  ai: 'AI',
};

export const SETTINGS_SECTION_DESCRIPTIONS: Record<SettingsSection, string> = {
  app: 'Studio preferences and global defaults',
  project: 'Resolution, timing, and project metadata',
  ai: 'Model categories, provider pages, API keys, and defaults',
};