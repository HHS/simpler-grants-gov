import { get } from "lodash";

import React, { JSX } from "react";

import TextWidget from "src/components/applyForm/widgets/TextWidget";
import { DATA_CELL_BASE_CLASS } from "./budgetConstants";
import { amountSchema } from "./budgetSchemas";

export type DataCellProps = {
  children: React.ReactNode;
  className?: string;
  height?: string | number;
};

export const DataCell: React.FC<DataCellProps> = ({
  children,
  className = "",
  height = "inherit",
}) => (
  <td
    className={`${DATA_CELL_BASE_CLASS}${className ? ` ${className}` : ""}`}
    height={height}
  >
    <div className="display-flex flex-column">{children}</div>
  </td>
);

interface ActivityItemForTitles {
  activity_title?: string;
}

interface ActivityTitlesRowProps {
  activityItems: ReadonlyArray<ActivityItemForTitles>;
  columnIndices: ReadonlyArray<number>;
}

export const HelperText: React.FC<
  React.PropsWithChildren<{ hasHorizontalLine?: boolean; className?: string }>
> = ({ hasHorizontalLine = false, className, children }) => (
  <div
    className={[
      "text-italic",
      "font-sans-2xs",
      "width-full",
      "padding-top-2",
      "margin-top-1",
      "text-no-wrap",
      hasHorizontalLine && "border-top-2px",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {children}
  </div>
);

// Standard currency input wrapper
export const CurrencyInput: React.FC<{
  id: string;
  rawErrors?: string[];
  value?: string;
  bordered?: boolean;
  formClassName?: string;
  inputClassName?: string;
}> = ({
  id,
  rawErrors,
  value,
  bordered = false,
  formClassName = "margin-top-0 padding-top-05 simpler-currency-input-wrapper",
  inputClassName = "minw-10",
}) => (
  <TextWidget
    schema={amountSchema}
    id={id}
    rawErrors={rawErrors}
    formClassName={formClassName}
    inputClassName={`${inputClassName}${bordered ? " border-2px" : ""}${
      rawErrors && rawErrors.length ? " usa-input--error" : ""
    }`}
    inputMode="decimal"
    pattern="-?[0-9]*[.,]?[0-9]{0,2}"
    maxLength={14}
    value={value}
    placeholder="0.00"
    onInput={(e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      let next = el.value.replace(/[^0-9.-]/g, "");
      next = next.replace(/(?!^)-/g, "");
      const parts = next.split(".");
      if (parts.length > 2) {
        next = parts[0] + "." + parts.slice(1).join("");
      }
      if (parts[1]?.length > 2) {
        next = parts[0] + "." + parts[1].slice(0, 2);
      }
      el.value = next;
    }}
  />
);

/**
 * Display-only title cell
 * fallback dash
 * */
export const TitleCell: React.FC<{ items: unknown; rowIndex: number }> = ({
  items,
  rowIndex,
}) => {
  const title =
    (
      get(items, `[${rowIndex}].activity_title`) as string | undefined
    )?.trim() ?? "";
  const assistanceListing =
    (
      get(items, `[${rowIndex}].assistance_listing_number`) as
        | string
        | undefined
    )?.trim() ?? "";

  return (
    <div className="display-flex flex-column">
      <div className="minw-15 font-sans-sm text-italic">{title || "—"}</div>
      {assistanceListing ? (
        <div className="font-sans-3xs text-base-dark text-italic">
          CFDA: {assistanceListing}
        </div>
      ) : null}
    </div>
  );
};

/**
 * Decorative equals cell
 * between totals columns in some sections
 * */
export const EqualsSpacer: React.FC<{ show?: boolean }> = ({ show }) => (
  <td
    className="border-bottom-0 border-top-0 verticle-align-bottom text-center text-bold"
    aria-hidden="true"
  >
    {show ? "=" : ""}
  </td>
);

// Blank header spacer cell (used after a group of columns)
export const EmptyHeaderSpacer: React.FC = () => (
  <th
    className="bg-base-lightest border-bottom-0 border-x-0 border-right-0 border-left-0 border-base-light"
    aria-hidden="true"
  />
);

/**
 * Header cell class helper
 * removes the border class for the last item
 * */
export function getHeaderCellClass(index: number, totalCount: number): string {
  const base =
    "bg-base-lightest text-bold border-bottom-0 border-x-1px text-center";
  return index === totalCount - 1 ? base : `${base} border-base-light`;
}

/**
 * Column helper text like "Sum of column 3”
 * Lets you opt into the horizontal line
 * */
export const ColumnHelperText: React.FC<{
  columnNumber: number;
  hasHorizontalLine?: boolean;
}> = ({ columnNumber, hasHorizontalLine }) => (
  <HelperText hasHorizontalLine={hasHorizontalLine}>
    Sum of column {columnNumber}
  </HelperText>
);

/**
 * Row helper text like "Sum of row 12”
 * Lets you opt into the horizontal line
 * */
export const RowHelperText: React.FC<
  React.PropsWithChildren<{
    rowLabel: string | number;
    hasHorizontalLine?: boolean;
  }>
> = ({ rowLabel, hasHorizontalLine, children }) => (
  <HelperText hasHorizontalLine={hasHorizontalLine}>
    {children ?? `Sum of row ${rowLabel}`}
  </HelperText>
);

/**
 * Section B
 * Activity Titles
 * */
export function ActivityTitlesRow({
  activityItems,
  columnIndices,
}: ActivityTitlesRowProps): JSX.Element {
  return (
    <>
      {columnIndices.map((columnIndex) => {
        const title = activityItems?.[columnIndex]?.activity_title ?? "";
        const displayText = title.trim() !== "" ? title : "—";
        return (
          <td
            key={`occ-title-${columnIndex}`}
            className="padding-05 border-bottom-0 border-top-0 verticle-align-bottom"
          >
            <div className="minw-15 font-sans-sm text-italic text-center">
              {displayText}
            </div>
          </td>
        );
      })}
    </>
  );
}
