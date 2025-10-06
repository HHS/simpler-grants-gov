/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable testing-library/no-node-access */
import { RJSFSchema } from "@rjsf/utils";
import { render, screen } from "@testing-library/react";

import PrintWidget from "src/components/applyForm/widgets/PrintWidget";

describe("PrintWidget", () => {
  const defaultProps = {
    id: "test-field",
    required: false,
    schema: {
      title: "Test Field",
      type: "string" as const,
    },
    value: "Test Value",
    rawErrors: [],
    formClassName: "test-form-class",
    inputClassName: "test-input-class",
    placeholder: "",
    readonly: false,
    disabled: false,
    autofocus: false,
    label: "Test Label",
    hideLabel: false,
    hideError: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with basic props", () => {
    render(<PrintWidget {...defaultProps} />);

    expect(screen.getByText("Test Field")).toBeInTheDocument();
    expect(screen.getByText("Test Value")).toBeInTheDocument();
    expect(screen.getByTestId("test-field")).toBeInTheDocument();
  });

  it("displays the field title from schema", () => {
    const props = {
      ...defaultProps,
      schema: {
        ...defaultProps.schema,
        title: "Custom Field Title",
      },
    };

    render(<PrintWidget {...props} />);

    expect(screen.getByText("Custom Field Title")).toBeInTheDocument();
  });

  it("displays the field value", () => {
    const props = {
      ...defaultProps,
      value: "Custom Test Value",
    };

    render(<PrintWidget {...props} />);

    expect(screen.getByText("Custom Test Value")).toBeInTheDocument();
  });

  it("displays empty string when value is null or undefined", () => {
    const propsWithNull = {
      ...defaultProps,
      value: null,
    };

    render(<PrintWidget {...propsWithNull} />);

    const fieldElement = screen.getByTestId("test-field");
    expect(fieldElement).toHaveTextContent("");
  });

  it("shows required indicator when field is required", () => {
    const props = {
      ...defaultProps,
      required: true,
    };

    render(<PrintWidget {...props} />);

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("*")).toHaveClass(
      "usa-hint",
      "usa-hint--required",
      "text-no-underline",
    );
  });

  it("does not show required indicator when field is not required", () => {
    const props = {
      ...defaultProps,
      required: false,
    };

    render(<PrintWidget {...props} />);

    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("displays errors when rawErrors are provided", () => {
    const props = {
      ...defaultProps,
      rawErrors: ["Error message 1", "Error message 2"],
    };

    render(<PrintWidget {...props} />);

    expect(screen.getByTestId("errorMessage")).toBeInTheDocument();
    expect(screen.getByText("Error message 1")).toBeInTheDocument();
    expect(screen.getByText("Error message 2")).toBeInTheDocument();
  });

  it("does not display errors when rawErrors is empty", () => {
    const props = {
      ...defaultProps,
      rawErrors: [],
    };

    render(<PrintWidget {...props} />);

    expect(
      screen.queryByTestId("field-errors-test-field"),
    ).not.toBeInTheDocument();
  });

  it("applies error state to FormGroup when errors exist", () => {
    const props = {
      ...defaultProps,
      rawErrors: ["Some error"],
    };

    render(<PrintWidget {...props} />);
    expect(screen.getByTestId("errorMessage")).toBeInTheDocument();
  });

  it("applies custom CSS classes", () => {
    const props = {
      ...defaultProps,
      formClassName: "custom-form-class",
      inputClassName: "custom-input-class",
    };

    render(<PrintWidget {...props} />);

    const inputElement = screen.getByTestId("test-field");
    expect(inputElement).toHaveClass("custom-input-class");
  });

  it("sets correct HTML attributes", () => {
    render(<PrintWidget {...defaultProps} />);

    const fieldElement = screen.getByTestId("test-field");
    expect(fieldElement).toHaveAttribute("id", "test-field");
    expect(fieldElement).toHaveAttribute("data-testid", "test-field");
  });

  it("handles numeric values by converting to string", () => {
    const props = {
      ...defaultProps,
      value: 12345,
    };

    render(<PrintWidget {...props} />);

    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("renders with minimal props", () => {
    const minimalProps = {
      id: "minimal",
      schema: { title: "Minimal" } as RJSFSchema,
      value: "Value",
    };

    render(<PrintWidget {...minimalProps} />);

    expect(screen.getByText("Minimal")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });
});
