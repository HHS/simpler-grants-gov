"use client";

import React, { ReactNode } from "react";
import { Radio } from "@trussworks/react-uswds";

interface FilterRadioProps {
  id: string;
  name?: string;
  label: ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  checked?: boolean;
  value?: string;
  facetCount?: number;
  className?: string;
}

export const SearchFilterRadio = ({
  id,
  name,
  label,
  onChange,
  disabled = false,
  checked = false,
  value,
  facetCount,
  className,
}: FilterRadioProps) => (
  <Radio
    className={className}
    id={id}
    name={name || ""}
    label={
      <>
        <span>{label}</span>
        {Number.isInteger(facetCount) && (
          <span className="text-base-dark padding-left-05">[{facetCount}]</span>
        )}
      </>
    }
    onChange={onChange}
    disabled={disabled}
    checked={checked}
    value={value || ""}
  />
);
