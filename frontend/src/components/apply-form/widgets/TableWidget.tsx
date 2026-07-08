import { UswdsWidgetProps } from "src/types/applyForm/types";

import { Table } from "@trussworks/react-uswds";

function TableWidget({ label, uiSchemaField }: UswdsWidgetProps) {
  if (
    uiSchemaField?.type !== "multiField" ||
    uiSchemaField.widget !== "Table"
  ) {
    return null;
  }

  const { columns, rows } = uiSchemaField.children;
  const expectedCellCount = columns.length;

  // A Table row must provide one cell for each configured column.
  // Throw early so malformed UI schema configuration does not render a misaligned table.
  rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row.cells) || row.cells.length !== expectedCellCount) {
      throw new Error(
        `Table row ${rowIndex + 1} must contain exactly ${expectedCellCount} cells.`,
      );
    }
  });

  return (
    <Table
      bordered
      fullWidth
      scrollable
      data-testid="table-widget"
      data-table-name={uiSchemaField.name}
      data-table-column-count={columns.length}
      data-table-row-count={rows.length}
      caption={
        <span className="usa-sr-only">{label ?? uiSchemaField.name}</span>
      }
    >
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.columnHeader}
              scope="col"
              style={column.width ? { width: `${column.width}%` } : undefined}
            >
              {column.columnHeader}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`table-row-${rowIndex}`}>
            {row.cells.map((cell, cellIndex) => (
              <td
                key={`table-row-${rowIndex}-cell-${cellIndex}`}
                data-table-cell-type={cell.type}
              >
                {cell.type === "plainText" ? cell.staticContent : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default TableWidget;
