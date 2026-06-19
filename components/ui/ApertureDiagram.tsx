import { apertureOpenness, snapToApertureStop } from '@/lib/constants/aperture';

export interface ApertureDiagramProps {
  /** f-number (snapped to the nearest standard stop for display). */
  fNumber: number;
  /** Rendered width/height in pixels. */
  size?: number;
  /** Number of iris blades. */
  blades?: number;
  className?: string;
}

function bladePath(innerR: number, outerR: number, halfWidthDeg: number): string {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = innerR * Math.sin(rad(-halfWidthDeg));
  const y1 = -innerR * Math.cos(rad(-halfWidthDeg));
  const x2 = innerR * Math.sin(rad(halfWidthDeg));
  const y2 = -innerR * Math.cos(rad(halfWidthDeg));
  const x3 = outerR * Math.sin(rad(halfWidthDeg * 1.15));
  const y3 = -outerR * Math.cos(rad(halfWidthDeg * 1.15));
  const x4 = outerR * Math.sin(rad(-halfWidthDeg * 1.15));
  const y4 = -outerR * Math.cos(rad(-halfWidthDeg * 1.15));
  return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;
}

export function ApertureDiagram({
  fNumber,
  size = 56,
  blades = 8,
  className = '',
}: ApertureDiagramProps) {
  const f = snapToApertureStop(fNumber);
  const openness = apertureOpenness(f);
  const cx = 32;
  const cy = 32;
  const outerR = 27;
  const innerR = 3.5 + openness * (outerR - 6);
  const bladeStep = 360 / blades;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`.trim()}
      aria-hidden
      role="presentation"
    >
      <circle cx={cx} cy={cy} r={outerR + 2.5} fill="#18181b" stroke="#3f3f46" strokeWidth="1.25" />
      <g transform={`translate(${cx}, ${cy})`}>
        {Array.from({ length: blades }, (_, i) => (
          <path
            key={i}
            transform={`rotate(${i * bladeStep})`}
            d={bladePath(innerR, outerR, 13)}
            fill="#2e2e36"
            stroke="#52525b"
            strokeWidth="0.45"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={innerR} fill="#0c0c0f" />
      <circle cx={cx} cy={cy} r={outerR + 2.5} fill="none" stroke="#6366f1" strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}