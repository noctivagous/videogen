export type SettingsSection = 'app' | 'project' | 'ai';

export type SettingsAiTab = 'model-categories' | 'providers';

export const SETTINGS_SECTIONS: readonly SettingsSection[] = ['app', 'project', 'ai'] as const;

export const SETTINGS_AI_TABS: readonly SettingsAiTab[] = ['model-categories', 'providers'] as const;

export const DEFAULT_SETTINGS_SECTION: SettingsSection = 'ai';

export const DEFAULT_SETTINGS_AI_TAB: SettingsAiTab = 'model-categories';

export function isSettingsSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

export function isSettingsAiTab(value: string): value is SettingsAiTab {
  return (SETTINGS_AI_TABS as readonly string[]).includes(value);
}

export function settingsAiTabRoute(tab: SettingsAiTab = DEFAULT_SETTINGS_AI_TAB): string {
  return `/studio/settings/ai/${tab}`;
}

export function settingsSectionRoute(section: SettingsSection = DEFAULT_SETTINGS_SECTION): string {
  if (section === 'ai') {
    return settingsAiTabRoute(DEFAULT_SETTINGS_AI_TAB);
  }
  return `/studio/settings/${section}`;
}

export interface ParsedSettingsPath {
  section: SettingsSection;
  aiTab: SettingsAiTab | null;
  providerDetailId: string | null;
  labDetailId: string | null;
  categoryDetailId: string | null;
  checklistDetailId: string | null;
}

const EMPTY_AI_DETAILS = {
  providerDetailId: null,
  labDetailId: null,
  categoryDetailId: null,
  checklistDetailId: null,
} as const;

function parseAiPath(rest: string | undefined): Pick<
  ParsedSettingsPath,
  'aiTab' | 'providerDetailId' | 'labDetailId' | 'categoryDetailId' | 'checklistDetailId'
> {
  if (!rest) {
    return { aiTab: DEFAULT_SETTINGS_AI_TAB, ...EMPTY_AI_DETAILS };
  }

  if (rest === 'model-categories' || rest === 'providers') {
    return { aiTab: rest, ...EMPTY_AI_DETAILS };
  }

  const nestedCategoryMatch = rest.match(/^model-categories\/category\/([^/]+)$/);
  if (nestedCategoryMatch) {
    return {
      aiTab: 'model-categories',
      providerDetailId: null,
      labDetailId: null,
      categoryDetailId: decodeURIComponent(nestedCategoryMatch[1]),
      checklistDetailId: null,
    };
  }

  const nestedChecklistMatch = rest.match(/^model-categories\/checklist\/([^/]+)$/);
  if (nestedChecklistMatch) {
    return {
      aiTab: 'model-categories',
      providerDetailId: null,
      labDetailId: null,
      categoryDetailId: null,
      checklistDetailId: decodeURIComponent(nestedChecklistMatch[1]),
    };
  }

  const nestedLabMatch = rest.match(/^providers\/lab\/([^/]+)$/);
  if (nestedLabMatch) {
    return {
      aiTab: 'providers',
      providerDetailId: null,
      labDetailId: decodeURIComponent(nestedLabMatch[1]),
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const nestedProviderMatch = rest.match(/^providers\/provider\/([^/]+)$/);
  if (nestedProviderMatch) {
    return {
      aiTab: 'providers',
      providerDetailId: decodeURIComponent(nestedProviderMatch[1]),
      labDetailId: null,
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const labMatch = rest.match(/^lab\/([^/]+)$/);
  if (labMatch) {
    return {
      aiTab: 'providers',
      providerDetailId: null,
      labDetailId: decodeURIComponent(labMatch[1]),
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const providerMatch = rest.match(/^provider\/([^/]+)$/);
  if (providerMatch) {
    return {
      aiTab: 'providers',
      providerDetailId: decodeURIComponent(providerMatch[1]),
      labDetailId: null,
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const categoryMatch = rest.match(/^category\/([^/]+)$/);
  if (categoryMatch) {
    return {
      aiTab: 'model-categories',
      providerDetailId: null,
      labDetailId: null,
      categoryDetailId: decodeURIComponent(categoryMatch[1]),
      checklistDetailId: null,
    };
  }

  const checklistMatch = rest.match(/^checklist\/([^/]+)$/);
  if (checklistMatch) {
    return {
      aiTab: 'model-categories',
      providerDetailId: null,
      labDetailId: null,
      categoryDetailId: null,
      checklistDetailId: decodeURIComponent(checklistMatch[1]),
    };
  }

  return { aiTab: null, ...EMPTY_AI_DETAILS };
}

export function parseSettingsPathname(pathname: string): ParsedSettingsPath | null {
  if (pathname === '/studio/settings') {
    return {
      section: DEFAULT_SETTINGS_SECTION,
      aiTab: DEFAULT_SETTINGS_AI_TAB,
      ...EMPTY_AI_DETAILS,
    };
  }

  const legacyProviderMatch = pathname.match(/^\/studio\/settings\/provider\/([^/]+)$/);
  if (legacyProviderMatch) {
    return {
      section: 'ai',
      aiTab: 'providers',
      providerDetailId: decodeURIComponent(legacyProviderMatch[1]),
      labDetailId: null,
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const legacyLabMatch = pathname.match(/^\/studio\/settings\/lab\/([^/]+)$/);
  if (legacyLabMatch) {
    return {
      section: 'ai',
      aiTab: 'providers',
      providerDetailId: null,
      labDetailId: decodeURIComponent(legacyLabMatch[1]),
      categoryDetailId: null,
      checklistDetailId: null,
    };
  }

  const legacyCategoryMatch = pathname.match(/^\/studio\/settings\/category\/([^/]+)$/);
  if (legacyCategoryMatch) {
    return {
      section: 'ai',
      aiTab: 'model-categories',
      providerDetailId: null,
      labDetailId: null,
      categoryDetailId: decodeURIComponent(legacyCategoryMatch[1]),
      checklistDetailId: null,
    };
  }

  const legacyChecklistMatch = pathname.match(/^\/studio\/settings\/checklist\/([^/]+)$/);
  if (legacyChecklistMatch) {
    return {
      section: 'ai',
      aiTab: 'model-categories',
      providerDetailId: null,
      labDetailId: null,
      categoryDetailId: null,
      checklistDetailId: decodeURIComponent(legacyChecklistMatch[1]),
    };
  }

  const sectionMatch = pathname.match(/^\/studio\/settings\/(app|project|ai)(?:\/(.*))?$/);
  if (!sectionMatch) return null;

  const section = sectionMatch[1] as SettingsSection;
  if (section !== 'ai') {
    return {
      section,
      aiTab: null,
      ...EMPTY_AI_DETAILS,
    };
  }

  const aiPath = parseAiPath(sectionMatch[2]);
  if (aiPath.aiTab === null) return null;

  return { section, ...aiPath };
}

export function resolveSettingsPathRedirect(pathname: string): string | null {
  if (pathname === '/studio/settings') {
    return settingsSectionRoute(DEFAULT_SETTINGS_SECTION);
  }

  if (pathname === '/studio/settings/ai') {
    return settingsAiTabRoute(DEFAULT_SETTINGS_AI_TAB);
  }

  const legacyMatch = pathname.match(/^\/studio\/settings\/(provider|lab|category|checklist)\/(.+)$/);
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

export const SETTINGS_AI_TAB_LABELS: Record<SettingsAiTab, string> = {
  'model-categories': 'Model categories',
  providers: 'Providers',
};

export const SETTINGS_SECTION_DESCRIPTIONS: Record<SettingsSection, string> = {
  app: 'Feature readiness checklist and studio-wide preferences',
  project: 'Resolution, timing, and project metadata',
  ai: 'Model categories, provider pages, API keys, and defaults',
};

export const SETTINGS_AI_TAB_DESCRIPTIONS: Record<SettingsAiTab, string> = {
  'model-categories': 'Tune model categories, defaults, and feature checklists',
  providers: 'Manage providers, models, and API keys',
};