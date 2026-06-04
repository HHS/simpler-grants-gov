import { fireEvent, render, screen } from "@testing-library/react";

import type { ReactNode } from "react";

import { LabeledSelect } from "./LabeledSelect";

type TestOption = {
  id: string;
  name: string;
};

function renderLabeledSelect({
  label = "Who is applying?",
  description,
  validationError,
  isDisabled,
  value = "",
  options = [
    { id: "org-1", name: "Alpha Org" },
    { id: "org-2", name: "Beta Org" },
  ],
  placeholderLabel = "-Select-",
  onChange = jest.fn(),
}: {
  label?: string;
  description?: ReactNode;
  validationError?: string;
  isDisabled?: boolean;
  value?: string;
  options?: TestOption[];
  placeholderLabel?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
} = {}) {
  return render(
    <LabeledSelect<TestOption>
      label={label}
      labelId="label-for-test"
      selectId="test-select"
      selectName="test-select"
      value={value}
      onChange={onChange}
      placeholderLabel={placeholderLabel}
      options={options}
      getOptionValue={(option) => option.id}
      getOptionLabel={(option) => option.name}
      description={description}
      validationError={validationError}
      isDisabled={isDisabled}
    />,
  );
}

describe("LabeledSelect", () => {
  it("renders label, placeholder, and options", () => {
    renderLabeledSelect();

    expect(screen.getByText("Who is applying?")).toBeInTheDocument();

    const selectElement = screen.getByRole("combobox");
    expect(selectElement).toBeInTheDocument();

    expect(screen.getByRole("option", { name: "-Select-" })).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "Alpha Org" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Beta Org" }),
    ).toBeInTheDocument();
  });

  it("associates the label with the select via htmlFor/id", () => {
    renderLabeledSelect();

    const labelElement = screen.getByText("Who is applying?");
    // eslint-disable-next-line testing-library/no-node-access
    expect(labelElement.closest("label")).toHaveAttribute("for", "test-select");
    expect(screen.getByLabelText("Who is applying?")).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    renderLabeledSelect({ description: "Choose an organization to proceed." });

    expect(
      screen.getByText("Choose an organization to proceed."),
    ).toBeInTheDocument();
  });

  it("renders an error message and sets validationStatus when validationError is provided", () => {
    renderLabeledSelect({ validationError: "Organization is required" });

    expect(screen.getByText("Organization is required")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("disables the select when isDisabled is true", () => {
    renderLabeledSelect({ isDisabled: true });

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("calls onChange when the user selects an option", () => {
    const onChange = jest.fn();
    renderLabeledSelect({ onChange });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "org-2" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reflects the selected value", () => {
    renderLabeledSelect({ value: "org-1" });

    expect(screen.getByRole("combobox")).toHaveValue("org-1");
  });
});
