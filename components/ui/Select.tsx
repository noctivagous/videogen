interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
  /** `inset` = recessed well; `relief` = very dark raised cap */
  fieldVariant?: 'inset' | 'relief';
}

export function Select({
  label,
  labelClassName = '',
  fieldVariant = 'inset',
  className = '',
  children,
  ...props
}: SelectProps) {
  const fieldClass = fieldVariant === 'relief' ? 'pro-field-relief' : 'pro-field';

  return (
    <div className="parameter-enclosure">
      {label && (
        <label className={`pro-label mb-2 block ${labelClassName}`.trim()}>{label}</label>
      )}
      <select
        className={`${fieldClass} w-full px-3 py-2 text-sm select-arrow appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}