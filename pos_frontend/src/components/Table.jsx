export default function Table({ columns, rows, loading, emptyMessage = "No data found.", onRowClick }) {
  if (loading) {
    return <div className="text-gray-500 p-8 text-center">Loading...</div>;
  }

  if (!rows || rows.length === 0) {
    return <p className="text-gray-500 py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`p-3 text-left text-xs font-semibold uppercase text-gray-500 bg-amber-50 ${col.className || ""}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              className={`border-b border-gray-100 ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={`p-3 ${col.className || ""}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
