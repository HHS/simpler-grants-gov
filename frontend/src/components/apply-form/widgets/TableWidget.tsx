import { UswdsWidgetProps } from "src/types/applyForm/types";

import { Table } from "@trussworks/react-uswds";

import TableCell from "../TableCell";

function TableWidget({ label, uiSchemaField }: UswdsWidgetProps) {
  if (
    uiSchemaField?.type !== "multiField" ||
    uiSchemaField.widget !== "Table"
  ) {
    return null;
  }

  // The first configured column is rendered from rowHeader, so cells only
  // represent the remaining data columns.
  const { columns, rows } = uiSchemaField.children;
  const expectedCellCount = columns.length - 1;

  rows.forEach((row, rowIndex) => {
    if (row.cells.length !== expectedCellCount) {
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
        {rows.map((row) => (
          <tr key={row.rowHeader}>
            <th scope="row">{row.rowHeader}</th>
            {row.cells.map((cell, cellIndex) => {
              const cellId = `${uiSchemaField.name}-${row.rowHeader}-${cellIndex}`;

              return (
                <td
                  key={`${row.rowHeader}-${cellIndex}`}
                  data-table-cell-type={cell.type}
                >
                  <TableCell cell={cell} id={cellId} />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default TableWidget;
