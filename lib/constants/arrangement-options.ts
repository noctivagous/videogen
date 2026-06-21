import type { VisualDropdownOption } from '@/lib/constants/field-size-options';
import type {
  GroupArrangement,
  SubjectArrangement,
  SubjectCount,
  ThreeShotArrangement,
  TwoShotArrangement,
} from '@/lib/types/studio';

const TWO_SHOT_ARRANGEMENTS: TwoShotArrangement[] = [
  'two-shot-clean',
  'two-shot-dirty',
  'ots-left',
  'ots-right',
  'profile',
  'staggered',
];

const THREE_SHOT_ARRANGEMENTS: ThreeShotArrangement[] = [
  'three-shot-clean',
  'three-shot-staggered',
  'three-shot-ots',
  'three-shot-triangle',
];

const GROUP_ARRANGEMENTS: GroupArrangement[] = [
  'lineup',
  'conversation-circle',
  'walk-and-talk',
];

const ARRANGEMENT_LABELS: Record<SubjectArrangement, string> = {
  'two-shot-clean': 'Two-shot Clean',
  'two-shot-dirty': 'Two-shot Dirty',
  'ots-left': 'OTS Left',
  'ots-right': 'OTS Right',
  profile: 'Profile',
  staggered: 'Staggered',
  'three-shot-clean': 'Three-shot Clean',
  'three-shot-staggered': 'Three-shot Staggered',
  'three-shot-ots': 'Three-shot OTS',
  'three-shot-triangle': 'Three-shot Triangle',
  lineup: 'Lineup',
  'conversation-circle': 'Conversation Circle',
  'walk-and-talk': 'Walk-and-talk',
};

const ARRANGEMENT_SHORT: Record<SubjectArrangement, string> = {
  'two-shot-clean': 'Clean',
  'two-shot-dirty': 'Dirty',
  'ots-left': 'OTS L',
  'ots-right': 'OTS R',
  profile: 'Profile',
  staggered: 'Staggered',
  'three-shot-clean': 'Clean',
  'three-shot-staggered': 'Staggered',
  'three-shot-ots': 'OTS',
  'three-shot-triangle': 'Triangle',
  lineup: 'Lineup',
  'conversation-circle': 'Circle',
  'walk-and-talk': 'Walk',
};

export const ARRANGEMENT_PROMPT_LABELS: Record<SubjectArrangement, string> = {
  'two-shot-clean': 'two shot clean, both facing camera',
  'two-shot-dirty': 'two shot dirty, foreground soft shoulder',
  'ots-left': 'over-the-shoulder from left',
  'ots-right': 'over-the-shoulder from right',
  profile: 'profile two shot, facing each other',
  staggered: 'staggered depth two shot',
  'three-shot-clean': 'three shot clean, equal weight',
  'three-shot-staggered': 'three shot staggered depth',
  'three-shot-ots': 'three shot over-the-shoulder',
  'three-shot-triangle': 'three shot conversation triangle',
  lineup: 'group lineup facing camera',
  'conversation-circle': 'group conversation circle',
  'walk-and-talk': 'group walk-and-talk staggered depth',
};

function toOptions(values: SubjectArrangement[]): VisualDropdownOption<SubjectArrangement>[] {
  return values.map((value) => ({
    value,
    label: ARRANGEMENT_LABELS[value],
    shortLabel: ARRANGEMENT_SHORT[value],
  }));
}

export const TWO_SHOT_ARRANGEMENT_OPTIONS = toOptions(TWO_SHOT_ARRANGEMENTS);
export const THREE_SHOT_ARRANGEMENT_OPTIONS = toOptions(THREE_SHOT_ARRANGEMENTS);
export const GROUP_ARRANGEMENT_OPTIONS = toOptions(GROUP_ARRANGEMENTS);

export function getArrangementOptionsForSubjectCount(
  subjectCount: SubjectCount,
): VisualDropdownOption<SubjectArrangement>[] {
  switch (subjectCount) {
    case '2s':
      return TWO_SHOT_ARRANGEMENT_OPTIONS;
    case '3s':
      return THREE_SHOT_ARRANGEMENT_OPTIONS;
    case 'group':
      return GROUP_ARRANGEMENT_OPTIONS;
    default:
      return [];
  }
}

export function defaultArrangementForSubjectCount(subjectCount: SubjectCount): SubjectArrangement {
  switch (subjectCount) {
    case '2s':
      return 'two-shot-clean';
    case '3s':
      return 'three-shot-clean';
    case 'group':
      return 'lineup';
    default:
      return 'two-shot-clean';
  }
}

export function isArrangementValidForSubjectCount(
  subjectCount: SubjectCount,
  arrangement: SubjectArrangement,
): boolean {
  return getArrangementOptionsForSubjectCount(subjectCount).some((o) => o.value === arrangement);
}

export function normalizeArrangement(
  subjectCount: SubjectCount,
  arrangement: SubjectArrangement | undefined,
): SubjectArrangement {
  if (arrangement && isArrangementValidForSubjectCount(subjectCount, arrangement)) {
    return arrangement;
  }
  return defaultArrangementForSubjectCount(subjectCount);
}
