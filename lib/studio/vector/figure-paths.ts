import type { BlockingFigure, BlockingPose } from '@/lib/studio/blocking-layout';

const ADULT_H = 180;

export function figureViewHeight(variant: BlockingFigure['variant']): number {
  if (variant === 'child') return 105;
  if (variant === 'shoulder') return 110;
  return ADULT_H;
}

function poseAngles(pose: BlockingPose, animTime: number) {
  const swing = Math.sin(animTime * 3) * 12;
  const nod = pose === 'talking' ? Math.sin(animTime * 4) * 6 : 0;
  return {
    head: -8 + nod,
    lArm: pose === 'walking' ? -8 + swing : -8,
    rArm: pose === 'walking' ? -8 - swing : -8,
    lElbow: 18,
    rElbow: 18,
    lLeg: pose === 'walking' ? swing * 0.4 : 0,
    rLeg: pose === 'walking' ? -swing * 0.4 : 0,
    torso: 2,
  };
}

function rot(deg: number, cx = 0, cy = 0) {
  return `rotate(${deg} ${cx} ${cy})`;
}

export function renderPaperFigure(fig: BlockingFigure, animTime: number): string {
  if (!fig.visible) return '';

  const p = poseAngles(fig.pose, animTime);
  const hideLegs = fig.hideLegs || fig.variant === 'shoulder';

  if (fig.variant === 'shoulder') {
    return `<g class="vector-figure" fill="${fig.color}">
      <ellipse cx="50" cy="35" rx="28" ry="22" />
      <rect x="62" y="20" width="18" height="55" rx="8" transform="${rot(-20, 71, 20)}" />
      <rect x="30" y="45" width="45" height="60" rx="12" />
    </g>`;
  }

  const legs = hideLegs
    ? ''
    : `<g transform="${rot(p.lLeg, 42, 118)}"><rect x="36" y="118" width="12" height="48" rx="5" /></g>
       <g transform="${rot(p.rLeg, 58, 118)}"><rect x="52" y="118" width="12" height="48" rx="5" /></g>`;

  return `<g class="vector-figure" fill="${fig.color}">
    <g transform="${rot(p.torso, 50, 95)}"><rect x="38" y="72" width="24" height="48" rx="10" /></g>
    <g transform="${rot(p.head, 50, 48)}"><circle cx="50" cy="38" r="16" /></g>
    <g transform="${rot(p.lArm, 38, 78)}"><rect x="22" y="72" width="14" height="42" rx="6" transform="${rot(p.lElbow, 29, 114)}" /></g>
    <g transform="${rot(-p.rArm, 62, 78)}"><rect x="64" y="72" width="14" height="42" rx="6" transform="${rot(-p.rElbow, 71, 114)}" /></g>
    ${legs}
  </g>`;
}

export function figureTransform(fig: BlockingFigure): string {
  const h = figureViewHeight(fig.variant);
  const scaleFactor = fig.scale * 0.38;
  return `translate(${fig.x} ${fig.y}) rotate(${fig.rotation}) scale(${scaleFactor}) translate(-50 -${h})`;
}