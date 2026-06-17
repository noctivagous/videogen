interface RangeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueLabel: string;
  colorTemp?: boolean;
}

export function RangeSlider({ label, valueLabel, colorTemp, className = '', ...props }: RangeSliderProps) {
  return (
    <div className="parameter-enclosure">
      <label className="text-xs text-gray-400 mb-2 block flex justify-between">
        <span>{label}</span>
        <span className="text-brand-400 font-medium">{valueLabel}</span>
      </label>
      <input
        type="range"
        className={`w-full ${colorTemp ? 'color-temp-slider' : ''} ${className}`}
        {...props}
      />
    </div>
  );
}