import type { ReactNode } from "react";
import { ErrorMessage, Label, Select } from "@trussworks/react-uswds";

type LabeledSelectProps<OptionType> = {
  label: string;
  labelId: string;
  selectId: string;
  selectName: string;

  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;

  placeholderLabel: string;

  options: OptionType[];
  getOptionValue: (option: OptionType) => string;
  getOptionLabel: (option: OptionType) => string;

  description?: ReactNode;
  validationError?: string;
  isDisabled?: boolean;
};

export function LabeledSelect<OptionType>({
  label,
  labelId,
  selectId,
  selectName,
  value,
  onChange,
  placeholderLabel,
  options,
  getOptionValue,
  getOptionLabel,
  description,
  validationError,
  isDisabled = false,
}: LabeledSelectProps<OptionType>) {
  const hasValidationError = Boolean(validationError);

  return (
    <>
      <Label id={labelId} htmlFor={selectId} className="text-bold margin-top-4">
        {label}
        {description ? <div>{description}</div> : null}
      </Label>

      {validationError ? <ErrorMessage>{validationError}</ErrorMessage> : null}

      <Select
        id={selectId}
        name={selectName}
        onChange={onChange}
        value={value}
        validationStatus={hasValidationError ? "error" : undefined}
        disabled={isDisabled}
      >
        <option value="" disabled>
          {placeholderLabel}
        </option>

        {options.map((option) => {
          const optionValue = getOptionValue(option);
          return (
            <option key={optionValue} value={optionValue}>
              {getOptionLabel(option)}
            </option>
          );
        })}
      </Select>
    </>
  );
}
