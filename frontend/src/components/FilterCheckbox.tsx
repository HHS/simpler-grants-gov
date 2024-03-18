"use client";

import { Checkbox } from "@trussworks/react-uswds";
import React from "react";

interface FilterCheckboxProps {
  id: string;
  name?: string;
  label: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  checked?: boolean;
  value?: string;
}

const FilterCheckbox: React.FC<FilterCheckboxProps> = ({
  id,
  name,
  label,
  onChange,
  disabled = false, // Default enabled. Pass in a mounted from parent if necessary.
  checked = false,
  value,
}) => (
  <Checkbox
    id={id}
    name={name || ""}
    label={label}
    onChange={onChange}
    disabled={disabled}
    checked={checked}
    value={value || ""}
  />
);

export default FilterCheckbox;
