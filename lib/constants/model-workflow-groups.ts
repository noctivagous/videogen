export type ModelUxGroupId =
  | 'image-video'
  | 'image-editing'
  | 'video-workflows'
  | 'finish-audio'
  | 'quality'
  | 'advanced';

const MODEL_WORKFLOW_GROUP_BACKGROUND_BASE = '/stock/app-styling/model-workflow-groups';

export function getModelWorkflowGroupBackgroundUrl(id: ModelUxGroupId): string {
  return `${MODEL_WORKFLOW_GROUP_BACKGROUND_BASE}/${id}.jpg`;
}