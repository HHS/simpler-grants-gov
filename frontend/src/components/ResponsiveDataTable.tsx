"use client";

import React, { useMemo, useState } from "react";
import clsx from "clsx";
import { Table } from "@trussworks/react-uswds";

export type SortDirection = "ascending" | "descending";
type TriStateSort = { columnId: string | null; direction: SortDirection };

/**
 * Column definition for ResponsiveDataTable.
 *
 * Notes:
 * - Sorting requires either `accessor` (string/number) **or** `sortComparator`.
 * - On small screens, cells "stack" with a mini header (the `header` content).
 *   Use `stackOrder` to control order; values < 0 hide the column on small screens.
 * - For accessibility, provide `ariaLabel` when `header` isn’t plain text.
 */
export type ResponsiveColumn<RowType> = {
  /** Unique id for the column (used for sort state & keys) */
  id: string;
  /** Header node (renders in <th> and as the mini header for stacked cells) */
  header: React.ReactNode;
  /** Optional ARIA label if header is not text */
  ariaLabel?: string;
  /** Whether this column can be sorted (requires accessor or sortComparator) */
  sortable?: boolean;
  /** Custom comparator; use for complex sort (dates, currency, nulls) */
  sortComparator?: (a: RowType, b: RowType) => number;
  /**
   * Accessor used for default sorting (must return string | number).
   * Also provides default cell text when `cell` isn’t supplied.
   */
  accessor?: (row: RowType) => string | number;
  /** Custom cell renderer for full control of the cell content */
  cell?: (row: RowType) => React.ReactNode;
  /** USWDS/Tailwind classes for header or cell */
  headerClassName?: string;
  cellClassName?: string;
  /**
   * Mobile stacking order.
   * - Smaller numbers appear higher in the stacked layout.
   * - `< 0` hides the cell on small screens.
   * On tablet-lg and up, order is the column index.
   */
  stackOrder?: number;
  /** Minimum width helper class (e.g., 'minw-15') */
  minWidthClassName?: string;
};

/**
 * Props for ResponsiveDataTable.
 *
 * Usage:
 * ```tsx
 * <ResponsiveDataTable<MyRowType>
 *   title="Results"
 *   description="Search results for…"
 *   rows={data}
 *   columns={[
 *     { id: "name", header: "Name", sortable: true, accessor: r => r.name, stackOrder: 0 },
 *     { id: "email", header: "Email", sortable: true, accessor: r => r.email, stackOrder: 1 },
 *     { id: "actions", header: "Actions", cell: r => <Button>Open</Button>, stackOrder: 2 }
 *   ]}
 * />
 * ```
 *
 * Sorting:
 * - Tri-state per column: Asc → Desc → Unsorted (original order).
 * - If `sortComparator` is provided, it’s used; otherwise `accessor` is used.
 * - `accessor` should normalize values (e.g., to epoch ms or a lowercase string).
 */
export interface ResponsiveDataTableProps<RowType> {
  /** H2 title displayed above the table */
  title: string;
  /** Optional paragraph under the title */
  description?: string;
  /** Array of domain rows to render */
  rows: ReadonlyArray<RowType>;
  /** Column definitions (see ResponsiveColumn) */
  columns: ReadonlyArray<ResponsiveColumn<RowType>>;
  /** Message shown when `rows` is empty */
  emptyMessage?: string;
  /** Additional classes for the USWDS Table */
  tableClassName?: string;
}

/**
 * A generic, tri-state-sortable, responsive table that:
 * - stacks cells with per-column mobile order,
 * - supports hiding cells on small screens,
 * - preserves accessible headers for stacked layout,
 * - supports custom cell renderers and comparators.
 */
export function ResponsiveDataTable<RowType>({
  title,
  description,
  rows,
  columns,
  emptyMessage = "No items found.",
  tableClassName = "simpler-responsive-table width-full tablet-lg:width-auto border-base tablet-lg:border-0",
}: ResponsiveDataTableProps<RowType>) {
  const [sortState, setSortState] = useState<TriStateSort>({
    columnId: null,
    direction: "ascending",
  });

  function onHeaderClick(column: ResponsiveColumn<RowType>): void {
    const isSortable = Boolean(column.sortable && (column.sortComparator || column.accessor));
    if (!isSortable) return;
    setSortState((previous) => {
      if (previous.columnId !== column.id) {
        return { columnId: column.id, direction: "ascending" };
      }
      if (previous.direction === "ascending") {
        return { columnId: column.id, direction: "descending" };
      }
      return { columnId: null, direction: "ascending" }; // unsort
    });
  }

  const sortedRows = useMemo(() => {
    if (sortState.columnId === null) return rows;
    const column = columns.find((c) => c.id === sortState.columnId);
    if (!column) return rows;

    const copy = rows.slice();

    if (column.sortComparator) {
      copy.sort((a, b) => {
        const result = column.sortComparator!(a, b);
        return sortState.direction === "ascending" ? result : -result;
      });
      return copy;
    }

    if (column.accessor) {
      copy.sort((a, b) => {
        const aVal = column.accessor!(a);
        const bVal = column.accessor!(b);
        let result = 0;
        if (typeof aVal === "number" && typeof bVal === "number") {
          result = aVal - bVal;
        } else {
          const aText = String(aVal ?? "").toLowerCase();
          const bText = String(bVal ?? "").toLowerCase();
          if (aText < bText) result = -1;
          else if (aText > bText) result = 1;
        }
        return sortState.direction === "ascending" ? result : -result;
      });
      return copy;
    }

    return rows;
  }, [rows, columns, sortState]);

  function ariaSortFor(columnId: string, sortable?: boolean): React.AriaAttributes["aria-sort"] {
    if (!sortable) return "none";
    if (sortState.columnId !== columnId) return "none";
    return sortState.direction;
  }

  function sortGlyph(columnId: string): string {
    if (sortState.columnId !== columnId) return "↕";
    return sortState.direction === "ascending" ? "▲" : "▼";
  }

  return (
    <section className="usa-table-container--scrollable margin-bottom-5">
      <h2 className="margin-bottom-1 font-sans-lg">{title}</h2>
      {description ? <p className="margin-bottom-2 margin-top-1">{description}</p> : null}

      <Table className={tableClassName}>
        <thead>
          <tr>
            {columns.map((col, index) => {
              const isSortable = Boolean(col.sortable && (col.sortComparator || col.accessor));
              const ariaLabel =
                col.ariaLabel ?? (typeof col.header === "string" ? col.header : `Column ${index + 1}`);
              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSortFor(col.id, isSortable)}
                  className={clsx(
                    "bg-base-lightest padding-y-205",
                    "minw-15",
                    col.minWidthClassName,
                    col.headerClassName,
                    { "cursor-pointer": isSortable },
                  )}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className="usa-button usa-button--unstyled display-flex flex-align-center font-sans-2xs text-bold text-no-underline text-gray-90"
                      onClick={() => onHeaderClick(col)}
                      aria-label={`Sort by ${ariaLabel}`}
                    >
                      <span className="margin-right-05">{col.header}</span>
                      <span aria-hidden>{sortGlyph(col.id)}</span>
                    </button>
                  ) : (
                    <span className="display-flex flex-align-center font-sans-2xs text-bold text-no-underline text-gray-90">
                      {col.header}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyMessage}</td>
            </tr>
          ) : (
            sortedRows.map((row, rowIndex) => (
              <tr
                key={`responsive-row-${rowIndex}`}
                className="border-base border-x border-y tablet-lg:border-0"
              >
                {columns.map((col, colIndex) => {
                  const stackOrder = col.stackOrder ?? 0;
                  const hideOnMobile = stackOrder < 0;
                  return (
                    <td
                      key={`responsive-cell-${rowIndex}-${col.id}`}
                      className={clsx(
                        "tablet-lg:display-table-cell",
                        "border-base",
                        `order-${stackOrder}`,
                        `tablet-lg:order-${colIndex}`,
                        col.cellClassName,
                        {
                          "display-none": hideOnMobile,
                          "display-block": !hideOnMobile,
                        },
                      )}
                    >
                      <div className="display-flex flex-align-center">
                        <div className="tablet-lg:display-none flex-1 text-bold">
                          {col.header}
                        </div>
                        <div className="flex-2">
                          {col.cell ? col.cell(row) : col.accessor ? String(col.accessor(row)) : null}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </section>
  );
}
