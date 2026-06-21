import workflowsJson from '@/video-generation-workflows.json';
import type { Workflow } from '@/lib/types/studio';

export interface WorkflowModelRequirements {
  capabilities: string[];
  anyOf?: string[];
  preferred?: string;
  fallback?: string;
  providers?: Array<{ name: string; minVersion?: string }>;
  unavailableMessage?: string;
}

export interface WorkflowDefinition {
  id: Workflow;
  label: string;
  description: string;
  purpose?: string;
  default?: boolean;
  modelRequirements?: WorkflowModelRequirements;
}

export interface WorkflowGroup {
  group: string;
  items: WorkflowDefinition[];
}

const WORKFLOW_GROUPS = workflowsJson as WorkflowGroup[];

/** Legacy persisted IDs → canonical JSON IDs. */
const LEGACY_WORKFLOW_ALIASES: Record<string, Workflow> = {
  'lock-start-frame': 'bake-start-frame',
  broll: 'pure-broll',
};

/** Workflows with full app support today. */
export const IMPLEMENTED_WORKFLOWS: ReadonlySet<Workflow> = new Set([
  'auto-place',
  'bake-start-frame',
]);

export function resolveWorkflowId(raw: string | undefined): Workflow | undefined {
  if (!raw) return undefined;
  const aliased = LEGACY_WORKFLOW_ALIASES[raw] ?? raw;
  return getAllWorkflowDefinitions().find((w) => w.id === aliased)?.id;
}

export function getWorkflowGroups(): WorkflowGroup[] {
  return WORKFLOW_GROUPS;
}

export function getAllWorkflowDefinitions(): WorkflowDefinition[] {
  return WORKFLOW_GROUPS.flatMap((g) => g.items);
}

export function getWorkflowDefinition(id: Workflow | string | undefined): WorkflowDefinition | undefined {
  const resolved = resolveWorkflowId(id) ?? (id as Workflow | undefined);
  if (!resolved) return undefined;
  return getAllWorkflowDefinitions().find((w) => w.id === resolved);
}

export function getDefaultWorkflowId(): Workflow {
  const fromJson = getAllWorkflowDefinitions().find((w) => w.default);
  return fromJson?.id ?? 'bake-start-frame';
}

export function isWorkflowImplemented(id: Workflow | string | undefined): boolean {
  const resolved = resolveWorkflowId(id);
  return resolved ? IMPLEMENTED_WORKFLOWS.has(resolved) : false;
}

export function workflowShortLabel(label: string): string {
  const dash = label.indexOf(' — ');
  if (dash > 0) return label.slice(0, dash);
  const paren = label.indexOf(' (');
  if (paren > 0) return label.slice(0, paren);
  return label.length > 28 ? `${label.slice(0, 26)}…` : label;
}
