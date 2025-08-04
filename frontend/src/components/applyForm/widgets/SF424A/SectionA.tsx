"use client";

import React, { useEffect, useState } from "react";
import { get, set } from "lodash";
import { UswdsWidgetProps } from "src/components/applyForm/types";

interface TableColumn {
  label: string;
  definition: string;
}

interface BudgetSummary {
  federal_estimated_unobligated_amount?: string;
  non_federal_estimated_unobligated_amount?: string;
  federal_new_or_revised_amount?: string;
  non_federal_new_or_revised_amount?: string;
  total_amount?: string;
}

interface ActivityLineItem {
  activity_title?: string;
  assistance_listing_number?: string;
  budget_summary?: BudgetSummary;
}

interface SectionAFormData {
  activity_line_items?: ActivityLineItem[];
  total_budget_summary?: BudgetSummary;
}

type MonetaryFieldKey =
  | "federal_estimated_unobligated_amount"
  | "non_federal_estimated_unobligated_amount"
  | "federal_new_or_revised_amount"
  | "non_federal_new_or_revised_amount"
  | "total_amount";

const monetaryFieldKeys: MonetaryFieldKey[] = [
  "federal_estimated_unobligated_amount",
  "non_federal_estimated_unobligated_amount",
  "federal_new_or_revised_amount",
  "non_federal_new_or_revised_amount",
  "total_amount",
];

// ✅ Safe default value parser
const getSafeSectionAData = (raw: unknown): SectionAFormData => {
  if (typeof raw === "object" && raw !== null) {
    return raw as SectionAFormData;
  }
  return {
    activity_line_items: [],
    total_budget_summary: {},
  };
};

export const SectionATableWidget = ({
  value,
  onChange,
  options,
}: UswdsWidgetProps): React.ReactElement => {
  const { columns = [] } = options as { columns: TableColumn[] };
  const formData = getSafeSectionAData(value);

  const [items, setItems] = useState<ActivityLineItem[]>(() =>
    Array.isArray(formData.activity_line_items) && formData.activity_line_items.length > 0
      ? formData.activity_line_items
      : [{}]
  );

  // 🧠 Update totals + formData on local state changes
  useEffect(() => {
    const total: BudgetSummary = {};

    monetaryFieldKeys.forEach((key) => {
      const sum = items.reduce((acc, item) => {
        const raw = item.budget_summary?.[key] ?? "0";
        const num = parseFloat(raw);
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
      total[key] = sum.toFixed(2);
    });

    onChange?.({
      activity_line_items: items,
      total_budget_summary: total,
    });
  }, [items, onChange]);

  const handleCellChange = (
    rowIndex: number,
    keyPath: string,
    newValue: string
  ) => {
    const cleanPath = keyPath
      .replace(/^\/properties\/activity_line_items\/items\/properties\//, "")
      .replace(/\/properties\//g, ".");
    const path = cleanPath.startsWith(".") ? cleanPath.slice(1) : cleanPath;

    const updated = [...items];
    const row = { ...updated[rowIndex] };
    set(row, path, newValue);
    updated[rowIndex] = row;
    setItems(updated);
  };

  const handleAddRow = () => {
    setItems([...items, {}]);
  };

  const handleRemoveRow = (rowIndex: number) => {
    if (items.length > 1) {
      const updated = [...items];
      updated.splice(rowIndex, 1);
      setItems(updated);
    }
  };

  const renderCell = (
    item: ActivityLineItem,
    rowIndex: number,
    col: TableColumn,
    colIndex: number,
    isTotalRow: boolean
  ) => {
    const keyPath = col.definition.replace("/properties/activity_line_items/items", "");
    const path = keyPath
      .replace(/^\/properties\/activity_line_items\/items\/properties\//, "")
      .replace(/\/properties\//g, ".");

    if (isTotalRow) {
      if (colIndex === 0) {
        return (
          <td key={colIndex} colSpan={2}>
            <strong>Total</strong>
          </td>
        );
      }
      if (colIndex === 1) return null;

      const totalKey = path.split(".").pop() as MonetaryFieldKey;
      const totalValue = formData.total_budget_summary?.[totalKey] ?? "0.00";

      return (
        <td key={colIndex}>
          <strong>{totalValue}</strong>
        </td>
      );
    }

    const cellValue = get(item, path, "");

    return (
      <td key={colIndex}>
        <input
          className="usa-input"
          type="text"
          value={cellValue}
          onChange={(e) =>
            handleCellChange(rowIndex, col.definition, e.target.value)
          }
        />
      </td>
    );
  };

  const allRows = [...items, {}]; // last row = totals
  return (
    <fieldset className="usa-fieldset" key="Section A - Budget Summary">
      <legend className="usa-legend font-sans-lg">Section A - Budget Summary</legend>
      <table className="usa-table usa-table--borderless">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((item, rowIndex, arr) => {
            const isTotalRow = rowIndex === arr.length - 1;
            return (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) =>
                  renderCell(item, rowIndex, col, colIndex, isTotalRow)
                )}
                <td>
                  {!isTotalRow && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(rowIndex)}
                      className="usa-button usa-button--unstyled text-secondary"
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        type="button"
        onClick={handleAddRow}
        className="usa-button usa-button--outline margin-top-2"
      >
        + Add row
      </button>
    </fieldset>
  );
};
