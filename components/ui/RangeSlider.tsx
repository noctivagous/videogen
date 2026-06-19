interface RangeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueLabel: string;
  colorTemp?: boolean;
  leading?: React.ReactNode;
}

export function RangeSlider({
  label,
  valueLabel,
  colorTemp,
  leading,
  className = '',
  ...props
}: RangeSliderProps) {
  return (
    <div className="parameter-enclosure">
      <label className="text-xs text-gray-400 mb-2 block flex justify-between">
        <span>{label}</span>
        <span className="text-brand-400 font-medium">{valueLabel}</span>
      </label>
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