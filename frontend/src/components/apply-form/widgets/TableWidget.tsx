import { TableWidgetProps } from "src/types/applyForm/types";

function TableWidget({ label, name }: TableWidgetProps) {
  return (
    <div data-testid="table-widget-placeholder" data-table-name={name}>
      {label}
    </div>
  );
}

export default TableWidget;
