import { TableWidgetProps } from "src/types/applyForm/types";

function TableWidget({
  label,
  uiSchemaField,
}: TableWidgetProps) {
  if (
    uiSchemaField.type !== "multiField" ||
    uiSchemaField.widget !== "Table"
  ) {
    return null;
  }

  const { columns, rows } = uiSchemaField.children;

  return (
    <div
      data-testid="table-widget-placeholder"
      data-table-name={uiSchemaField.name}
      data-table-column-count={columns.length}
      data-table-row-count={rows.length}
    >
      {label}
    </div>
  );
}

export default TableWidget;
