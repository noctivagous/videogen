interface RangeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueLabel: string;
  colorTemp?: boolean;
  leading?: React.ReactNode;
  labelTrailing?: React.ReactNode;
  labelClassName?: string;
}

export function RangeSlider({
  label,
  valueLabel,
  colorTemp,
  leading,
  labelTrailing,
  labelClassName = '',
  className = '',
  ...props
}: RangeSliderProps) {
  return (
    <div className="parameter-enclosure">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`pro-label ${labelClassName}`.trim()}>{label}</span>
        <span className="flex items-center gap-2">
          <span className="pro-value-pill">{valueLabel}</span>
          {labelTrailing}
        </span>
      </div>
      <div className={leading ? 'flex items-center gap-3' : undefined}>
        {leading}
        <input
          type="range"
          className={`pro-slider ${leading ? 'flex-1 min-w-0' : 'w-full'} ${colorTemp ? 'color-temp-slider' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}