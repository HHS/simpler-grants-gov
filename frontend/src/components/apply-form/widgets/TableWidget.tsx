import { UswdsWidgetProps } from "src/types/applyForm/types";

import { Table } from "@trussworks/react-uswds";

import TableCell from "src/components/apply-form/TableCell";

function TableWidget({
  disabled,
  isFormLocked,
  label,
  onChange,
  uiSchemaField,
  value,
}: UswdsWidgetProps) {
  if (
    uiSchemaField?.type !== "multiField" ||
    uiSchemaField.widget !== "Table"
  ) {
    return null;
  }

  const { columns, rows } = uiSchemaField.children;
  const expectedCellCount = columns.length;
  const isInteractionDisabled = Boolean(disabled || isFormLocked);

  const getRenderValue = (definition?: string) => {
    if (!definition || typeof value !== "object" || value === null) {
      return undefined;
    }

    const fieldName = definition.split("/").filter(Boolean).pop();

    if (!fieldName) {
      return undefined;
    }

    const renderValue = (value as Record<string, unknown>)[fieldName];
    return typeof renderValue === "string" || typeof renderValue === "number"
      ? renderValue
      : undefined;
  };

  const handleCellChange = (definition: string, nextValue: string) => {
    if (!definition) {
      return;
    }

    const fieldName = definition.split("/").filter(Boolean).pop();

    if (!fieldName) {
      return;
    }

    const currentValue =
      typeof value === "object" && value !== null ? value : {};

    onChange?.({
      ...(currentValue as Record<string, unknown>),
      [fieldName]: nextValue,
    });
  };

  // A Table row must provide one cell for each configured column, unless the
  // first column is represented by a row header, in which case the row can
  // provide one fewer data cell than the configured columns.
  rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row.cells)) {
      throw new Error(
        `Table row ${rowIndex + 1} must contain exactly ${expectedCellCount} cells.`,
      );
    }

    const hasRowHeaderColumn = row.cells.length === expectedCellCount - 1;
    const isValidCellCount =
      row.cells.length === expectedCellCount || hasRowHeaderColumn;

    if (!isValidCellCount) {
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
        {rows.map((row, rowIndex) => {
          const shouldRenderRowHeader = row.cells.length < expectedCellCount;
          const rowHeaderValue =
            row.rowHeader ??
            (rowIndex === 0 ? "First Row" : `Row ${rowIndex + 1}`);

          return (
            <tr key={`table-row-${rowIndex}`}>
              {shouldRenderRowHeader ? (
                <td key={`table-row-${rowIndex}-row-header`}>
                  <span className="display-block text-left" role="rowheader">
                    {rowHeaderValue}
                  </span>
                </td>
              ) : null}
              {row.cells.map((cell, cellIndex) => {
                const cellId = `${uiSchemaField.name}-${rowIndex}-${cellIndex}`;

                return (
                  <td
                    key={`table-row-${rowIndex}-cell-${cellIndex}`}
                    data-table-cell-type={cell.type}
                  >
                    <TableCell
                      cell={cell}
                      disabled={
                        cell.type === "input" ? isInteractionDisabled : false
                      }
                      id={cellId}
                      onChange={
                        cell.type === "input" && cell.definition
                          ? (nextValue) =>
                              handleCellChange(cell.definition, nextValue)
                          : undefined
                      }
                      value={
                        cell.type === "plainText"
                          ? undefined
                          : getRenderValue(cell.definition)
                      }
                    />
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export default TableWidget;
