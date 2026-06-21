export interface SettingsSummaryTableRow {
  id: string;
  label: string;
  value: string;
  active?: boolean;
}

export interface SettingsSummaryTableProps {
  columns: [string, string];
  rows: SettingsSummaryTableRow[];
  emptyMessage?: string;
  className?: string;
}

export function SettingsSummaryTable({
  columns,
  rows,
  emptyMessage = 'None selected',
  className = '',
}: SettingsSummaryTableProps) {
  if (rows.length === 0) {
    return (
      <p className={`workflow-settings-table__empty text-[10px] text-gray-500 leading-snug ${className}`.trim()}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <table className={`workflow-settings-table ${className}`.trim()}>
      <thead>
        <tr>
          <th scope="col">{columns[0]}</th>
          <th scope="col">{columns[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="workflow-settings-table__label">{row.label}</td>
            <td
              className={`workflow-settings-table__value ${
                row.active === false
                  ? 'workflow-settings-table__value--inactive'
                  : 'workflow-settings-table__value--active'
              }`}
            >
              {row.active !== false && row.value !== 'None' && row.value !== '—' ? (
                <>
                  <span aria-hidden="true">✓</span>
                  {row.value}
                </>
              ) : (
                row.value
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
