interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  return (
    <div className="bg-white border border-card-border rounded-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-table-header border-b border-card-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3 ${col.className || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="border-b border-row-border last:border-0 hover:bg-gray-50/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-6 py-4 text-sm ${col.className || ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
