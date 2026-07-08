import { ChangeEvent } from "react";
import { UiSchemaTableCell } from "src/types/applyForm/types";
import { formatTableCellValue } from "src/utils/applyForm/formatTableCellValue";

type TableCellProps = {
  cell: UiSchemaTableCell;
  id: string;
  value?: number | string | null;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

function TableCell({
  cell,
  id,
  value,
  disabled = false,
  onChange,
}: TableCellProps) {
  if (cell.type === "plainText") {
    return <span className="text-wrap">{cell.staticContent}</span>;
  }

  if (cell.type === "readOnly") {
    return (
      <output
        className="bg-base-lightest display-block padding-1 text-right"
        data-testid={`${id}-read-only`}
      >
        {formatTableCellValue(value, cell.format)}
      </output>
    );
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    if (nextValue === "" || /^-?\d*\.?\d*$/.test(nextValue)) {
      onChange?.(nextValue);
    }
  };

  return (
    <input
      aria-label={`Editable table value for ${cell.definition}`}
      className="usa-input margin-0 width-full"
      data-testid={`${id}-input`}
      disabled={disabled}
      id={id}
      inputMode="decimal"
      onChange={handleChange}
      pattern="-?[0-9]*[.]?[0-9]*"
      type="text"
      value={value ?? ""}
    />
  );
}

export default TableCell;
