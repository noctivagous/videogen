interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
}

export function Select({ label, labelClassName = '', className = '', children, ...props }: SelectProps) {
  return (
    <div className="parameter-enclosure">
      {label && (
        <label className={`pro-label mb-2 block ${labelClassName}`.trim()}>{label}</label>
      )}
      <select
        className={`pro-field w-full px-3 py-2 text-sm select-arrow appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}