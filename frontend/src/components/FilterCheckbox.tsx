"use client";

import React, { ReactNode } from "react";
import { Checkbox } from "@trussworks/react-uswds";

interface FilterCheckboxProps {
  id: string;
  name?: string;
  label: ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  checked?: boolean;
  value?: string;
}

const FilterCheckbox = ({
  id,
  name,
  label,
  onChange,
  disabled = false, // Default enabled. Pass in a mounted from parent if necessary.
  checked = false,
  value,
}: FilterCheckboxProps) => (
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
