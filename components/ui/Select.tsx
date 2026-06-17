interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div className="parameter-enclosure">
      {label && <label className="text-xs text-gray-400 mb-2 block">{label}</label>}
      <select
        className={`w-full bg-surface-700 hover:bg-surface-600 border border-surface-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all select-arrow appearance-none ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}