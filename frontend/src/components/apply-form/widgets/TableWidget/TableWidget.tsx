import { get, set } from "lodash";
import {
  FormValidationWarning,
  UswdsWidgetProps,
  type UiSchemaTableColumn,
  type UiSchemaTableMultiField,
  type UiSchemaTableRow,
} from "src/types/applyForm/types";
import {
  getFieldNameForHtml,
  jsonSchemaPointerToPath,
} from "src/utils/applyForm/applyFormUtils";

import { useCallback, useMemo } from "react";
import { Table } from "@trussworks/react-uswds";

import TableCell from "./TableCell";

function getJsonSchemaValuePath(
  definition: string | undefined,
): string | undefined {
  if (!definition) return undefined;

  const jsonPath = jsonSchemaPointerToPath(definition);
  return jsonPath.startsWith("$.") ? jsonPath.slice(2) : jsonPath;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Extract a form value for a given JSON Schema property path.
 * @param definition - JSON Schema property path (e.g., "/properties/federal_share")
 * @param value - The form object containing field values
 * @returns The form value, or undefined if not found or invalid
 */
function getRenderValue(
  definition: string | undefined,
  value: unknown,
): string | number | undefined {
  const valuePath = getJsonSchemaValuePath(definition);

  if (!valuePath || !isObjectRecord(value)) {
    return undefined;
  }

  const renderValue = get(value, valuePath);
  return typeof renderValue === "string" || typeof renderValue === "number"
    ? renderValue
    : undefined;
}

/**
 * TableWidget renders a data table with support for multiple cell types.
 *
 * This widget integrates with JSON Schema form rendering to display tabular data
 * with the following cell types:
 * - `plainText`: Static text content (category names, labels, etc.)
 * - `input`: Editable numeric input fields for form data
 * - `readOnly`: Calculated/computed values that cannot be edited
 *
 * Features:
 * - Responsive table layout with responsive USWDS Table component
 * - Automatic form value binding and updates
 * - Validation for numeric input cells (decimal numbers with optional signs)
 * - Number formatting support (integer, decimal, currency, dollar, percentage)
 * - Disabled state management (locks all input cells when form is locked)
 * - Accessibility: proper table semantics, ARIA labels, captions
 *
 * The widget automatically:
 * - Binds input cell values from the form data based on JSON Schema properties
 * - Updates form data when input cells change
 * - Formats read-only values according to the specified format
 * - Handles form locked state by disabling all input cells
 *
 * @example
 * // Table widget configuration in UI schema
 * {
 *   type: "multiField",
 *   name: "budget_table",
 *   widget: "Table",
 *   definition: [
 *     "/properties/federal_share",
 *     "/properties/non_federal_share",
 *     "/properties/total"
 *   ],
 *   children: {
 *     columns: [
 *       { columnHeader: "Budget Category", width: 30 },
 *       { columnHeader: "Federal Share", width: 23 },
 *       { columnHeader: "Non-Federal Share", width: 23 },
 *       { columnHeader: "Total", width: 24 }
 *     ],
 *     rows: [
 *       {
 *         cells: [
 *           { type: "plainText", staticContent: "Administrative" },
 *           {
 *             type: "input",
 *             definition: "/properties/federal_share",
 *             format: "dollar"
 *           },
 *           {
 *             type: "readOnly",
 *             definition: "/properties/non_federal_share",
 *             format: "dollar"
 *           },
 *           {
 *             type: "readOnly",
 *             definition: "/properties/total",
 *             format: "dollar"
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */
function TableWidget({
  disabled,
  isFormLocked,
  label,
  onChange,
  rawErrors = [],
  uiSchemaField,
  value,
}: UswdsWidgetProps) {
  /**
   * Handle changes to input cells and update the form value.
   * @param definition - JSON Schema property path for the cell
   * @param nextValue - The new value entered by the user
   */
  const handleCellChange = useCallback(
    (definition: string, nextValue: string) => {
      const valuePath = getJsonSchemaValuePath(definition);

      if (!valuePath) {
        return;
      }

      const currentValue = isObjectRecord(value) ? value : {};

      const nextFormValue = set({ ...currentValue }, valuePath, nextValue);

      onChange?.(nextFormValue);
    },
    [onChange, value],
  );
  // ensure hooks are called unconditionally; default to empty arrays
  const columns: UiSchemaTableColumn[] =
    (uiSchemaField as UiSchemaTableMultiField | undefined)?.children?.columns ??
    [];
  const rows: UiSchemaTableRow[] =
    (uiSchemaField as UiSchemaTableMultiField | undefined)?.children?.rows ??
    [];

  const cellChangeHandlers = useMemo(
    () =>
      rows.reduce(
        (handlers, row) => {
          row.cells.forEach((cell) => {
            if (cell.type === "input" && cell.definition) {
              handlers[cell.definition] = (nextValue: string) =>
                handleCellChange(cell.definition, nextValue);
            }
          });

          return handlers;
        },
        {} as Record<string, (nextValue: string) => void>,
      ),
    [handleCellChange, rows],
  );

  let rootFieldName: string | undefined;
  let rootFromDefinition = false;

  if (
    Array.isArray(uiSchemaField?.definition) &&
    uiSchemaField.definition.length === 1
  ) {
    const def = uiSchemaField.definition[0];
    const listMatch = def.match(
      /^\/properties\/([^/]+)\/items\/properties\/.+$/,
    );
    if (listMatch) {
      rootFieldName = listMatch[1];
      rootFromDefinition = true;
    } else {
      rootFieldName = getFieldNameForHtml({ definition: def });
      rootFromDefinition = true;
    }
  } else if (uiSchemaField?.name) {
    rootFieldName = uiSchemaField.name;
  } else if (typeof uiSchemaField?.definition === "string") {
    rootFieldName = getFieldNameForHtml({
      definition: uiSchemaField.definition,
    });
  } else {
    rootFieldName = undefined;
  }

  const buildCellName = (
    cellDefinition: string | undefined,
    rowIndex?: number,
  ): string | undefined => {
    if (!cellDefinition) return undefined;

    // Handle field-list child definitions: /properties/<list>/items/properties/<child>
    const listMatch = cellDefinition.match(
      /^\/properties\/([^/]+)\/items\/properties\/(.+)$/,
    );
    if (listMatch) {
      const [, listName, childPath] = listMatch;
      const childParts = childPath
        .split(/\/(?:properties\/)?/)
        .filter(Boolean)
        .map((p) => p.replace(/\\/g, ""));
      const childHtml = childParts.join("--");
      const indexPart = typeof rowIndex === "number" ? `[${rowIndex}]` : `[0]`;
      return `${listName}${indexPart}--${childHtml}`;
    }

    // Non-list child: build a field name from the cell definition.
    const childHtml = getFieldNameForHtml({ definition: cellDefinition });
    if (!childHtml) return undefined;

    if (!rootFieldName) return childHtml;

    if (rootFromDefinition) {
      return `${rootFieldName}--${childHtml}`;
    }

    return typeof rowIndex === "number"
      ? `${rootFieldName}[${rowIndex}]--${childHtml}`
      : `${rootFieldName}--${childHtml}`;
  };

  /**
   * Get validation errors for a specific cell based on its HTML form name.
   * Matches the cell's Name against the error field paths.
   * @param cellName - The HTML form name of the cell input
   * @returns An array of error messages for the cell, or an empty array if none
   */
  const allCellNames = rows
    .flatMap((row, rowIndex) =>
      row.cells.map((cell) => buildCellName(cell.definition, rowIndex)),
    )
    .filter((name): name is string => Boolean(name));

  const duplicateBaseNames = allCellNames.reduce<Record<string, number>>(
    (counts, name) => {
      const base = name.split("--").slice(-1)[0];
      counts[base] = (counts[base] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const getCellErrors = (cellName: string | undefined): string[] => {
    if (!cellName) return [];

    const exactMatches = (rawErrors as FormValidationWarning[])
      .filter((error) => error.field === cellName)
      .map((error) => String(error.message));

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    const baseName = cellName.split("--").slice(-1)[0];
    if (duplicateBaseNames[baseName] > 1) {
      return [];
    }

    return (rawErrors as FormValidationWarning[])
      .filter((error) => error.field === baseName)
      .map((error) => String(error.message));
  };

  if (
    uiSchemaField?.type !== "multiField" ||
    uiSchemaField.widget !== "Table"
  ) {
    return null;
  }
  const expectedCellCount = columns.length;
  const isInteractionDisabled = disabled || isFormLocked;
  // Validate that each row has the correct number of cells.
  rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row.cells)) {
      throw new Error(
        `Table row ${rowIndex + 1} must contain exactly ${expectedCellCount} cells.`,
      );
    }

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
      data-testid="table"
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
          const rowLabel =
            row.cells[0]?.type === "plainText"
              ? row.cells[0].staticContent
              : undefined;

          return (
            <tr key={`table-row-${rowIndex}`}>
              {row.cells.map((cell, cellIndex) => {
                const cellId = `${uiSchemaField.name}-${rowIndex}-${cellIndex}`;

                return (
                  <td
                    key={`table-row-${rowIndex}-cell-${cellIndex}`}
                    data-table-cell-type={cell.type}
                  >
                    <TableCell
                      cell={cell}
                      cellErrors={getCellErrors(
                        buildCellName(cell.definition, rowIndex),
                      )}
                      disabled={
                        cell.type === "input" ? isInteractionDisabled : false
                      }
                      id={cellId}
                      name={buildCellName(cell.definition, rowIndex)}
                      ariaLabel={
                        cell.type === "input"
                          ? [rowLabel, columns[cellIndex]?.columnHeader]
                              .filter(Boolean)
                              .join(", ")
                          : undefined
                      }
                      onChange={
                        cell.type === "input" && cell.definition
                          ? cellChangeHandlers[cell.definition]
                          : undefined
                      }
                      value={
                        cell.type === "plainText"
                          ? undefined
                          : getRenderValue(cell.definition, value)
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
