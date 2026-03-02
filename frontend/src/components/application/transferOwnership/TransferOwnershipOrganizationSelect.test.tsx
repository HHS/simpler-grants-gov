import { fireEvent, render, screen } from "@testing-library/react";
import type { UserOrganization } from "src/types/userTypes";

import { TransferOwnershipOrganizationSelect } from "./TransferOwnershipOrganizationSelect";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("src/components/LabeledSelect", () => ({
  LabeledSelect: ({
    label,
    placeholderLabel,
    value,
    onChange,
    options,
    getOptionValue,
    getOptionLabel,
    isDisabled,
  }: {
    label: string;
    placeholderLabel: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    options: UserOrganization[];
    getOptionValue: (option: UserOrganization) => string;
    getOptionLabel: (option: UserOrganization) => string;
    isDisabled?: boolean;
  }) => (
    <>
      <label>{label}</label>
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        disabled={isDisabled}
      >
        <option value="" disabled>
          {placeholderLabel}
        </option>
        {options.map((option) => (
          <option key={getOptionValue(option)} value={getOptionValue(option)}>
            {getOptionLabel(option)}
          </option>
        ))}
      </select>
    </>
  ),
}));

function buildOrganization(id: string, name: string): UserOrganization {
  return {
    organization_id: id,
    sam_gov_entity: { legal_business_name: name },
  } as UserOrganization;
}

describe("TransferOwnershipOrganizationSelect", () => {
  it("renders label and placeholder from translations", () => {
    render(
      <TransferOwnershipOrganizationSelect
        organizations={[]}
        selectedOrganization=""
        onOrganizationChange={jest.fn()}
      />,
    );

    expect(screen.getByText("selectTitle")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "default" })).toBeDisabled();
  });

  it("renders organization options", () => {
    render(
      <TransferOwnershipOrganizationSelect
        organizations={[buildOrganization("org-1", "Alpha Org")]}
        selectedOrganization=""
        onOrganizationChange={jest.fn()}
      />,
    );

    expect(
      screen.getByRole("option", { name: "Alpha Org" }),
    ).toBeInTheDocument();
  });

  it("calls onOrganizationChange when selection changes", () => {
    const onChange = jest.fn();

    render(
      <TransferOwnershipOrganizationSelect
        organizations={[buildOrganization("org-1", "Alpha Org")]}
        selectedOrganization=""
        onOrganizationChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "org-1" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("disables the select when isDisabled is true", () => {
    render(
      <TransferOwnershipOrganizationSelect
        organizations={[]}
        selectedOrganization=""
        onOrganizationChange={jest.fn()}
        isDisabled
      />,
    );

    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
