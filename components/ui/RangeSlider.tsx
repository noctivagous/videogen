interface RangeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueLabel: string;
  colorTemp?: boolean;
  leading?: React.ReactNode;
  labelTrailing?: React.ReactNode;
}

export function RangeSlider({
  label,
  valueLabel,
  colorTemp,
  leading,
  labelTrailing,
  className = '',
  ...props
}: RangeSliderProps) {
  return (
    <div className="parameter-enclosure">
      <div className="text-xs text-gray-400 mb-2 flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-brand-400 font-medium">{valueLabel}</span>
          {labelTrailing}
        </span>
      </div>
      <div className={leading ? 'flex items-center gap-3' : undefined}>
        {leading}
        <input
          type="range"
          className={`${leading ? 'flex-1 min-w-0' : 'w-full'} ${colorTemp ? 'color-temp-slider' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}