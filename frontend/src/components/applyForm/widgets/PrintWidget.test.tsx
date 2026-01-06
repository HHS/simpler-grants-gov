import type { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";

import React from "react";

import PrintWidget from "src/components/applyForm/widgets/PrintWidget";

type BaseProps = {
  id: string;
  required?: boolean;
  schema: RJSFSchema;
  value?: unknown;
  formClassName?: string;
  inputClassName?: string;
};

function renderWidget(overrides: Partial<BaseProps> = {}) {
  const props: BaseProps = {
    id: "test-field",
    required: false,
    schema: { title: "Test Field", type: "string" },
    value: "Test Value",
    formClassName: "test-form-class",
    inputClassName: "test-input-class",
    ...overrides,
  };

  // PrintWidget’s prop type is generic and wider than this minimal base.
  // We keep this test focused on user-visible rendering behavior.
  render(<PrintWidget {...props} />);

  return props;
}

describe("PrintWidget", () => {
  it("renders the title and value", () => {
    renderWidget();

    expect(screen.getByText("Test Field")).toBeInTheDocument();
    expect(screen.getByText("Test Value")).toBeInTheDocument();
    expect(screen.getByTestId("test-field")).toBeInTheDocument();
  });

  it("renders required indicator when required", () => {
    renderWidget({ required: true });

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders empty string when value is null", () => {
    renderWidget({ value: null });

    expect(screen.getByTestId("test-field")).toHaveTextContent("");
  });

  it("renders empty string when value is undefined", () => {
    renderWidget({ value: undefined });

    expect(screen.getByTestId("test-field")).toHaveTextContent("");
  });

  it("handles numbers by converting to string", () => {
    renderWidget({ value: 12345 });

    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("renders Yes/No for booleans", () => {
    renderWidget({ value: true });
    expect(screen.getByText("Yes")).toBeInTheDocument();

    renderWidget({ value: false, id: "bool-field" });
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("joins arrays while skipping null/undefined", () => {
    renderWidget({ value: ["A", null, "B", undefined, "C"] });

    expect(screen.getByText("A, B, C")).toBeInTheDocument();
  });

  it("stringifies objects for display", () => {
    const obj = { a: 1, b: "x" };
    renderWidget({ value: obj });

    expect(screen.getByText(JSON.stringify(obj))).toBeInTheDocument();
  });

  it("renders with minimal props", () => {
    render(
      <PrintWidget id="minimal" schema={{ title: "Minimal" }} value="Value" />,
    );

    expect(screen.getByText("Minimal")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("applies custom CSS classes", () => {
    renderWidget({ inputClassName: "custom-input-class" });

    expect(screen.getByTestId("test-field")).toHaveClass("custom-input-class");
  });
});
