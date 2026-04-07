import { fireEvent, render, screen } from "@testing-library/react";

import { SimplerSwitchFieldProps } from "src/components/SimplerSwitch";
import { NotificationPreferenceCard } from "./NotificationPreferenceCard";

jest.mock("src/components/SimplerSwitch", () => ({
  SimplerSwitchField: (props: SimplerSwitchFieldProps) => (
    <div>
      <button
        data-testid="switch"
        onClick={() => props.onCheckedChange?.(!props.checked)}
        disabled={props.disabled}
      >
        toggle
      </button>

      <span data-testid="label">{props.label}</span>
      <span data-testid="description">{props.description}</span>

      {props.errorMessage !== undefined && (
        <span data-testid="error">error</span>
      )}

      <span data-testid="aria-labelledby">{props.ariaLabelledBy || ""}</span>
    </div>
  ),
}));

describe("NotificationPreferenceCard", () => {
  const baseProps = {
    checkboxId: "test-checkbox",
    label: "Test Label",
    description: "Test Description",
    isChecked: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders label and description", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(screen.getByTestId("label")).toHaveTextContent("Test Label");
    expect(screen.getByTestId("description")).toHaveTextContent(
      "Test Description",
    );
  });

  it("passes checked state correctly", () => {
    render(<NotificationPreferenceCard {...baseProps} isChecked={true} />);

    const button = screen.getByTestId("switch");
    expect(button).toBeInTheDocument();
  });

  it("calls onCheckedChange when toggled", () => {
    const handleChange = jest.fn();

    render(
      <NotificationPreferenceCard
        {...baseProps}
        onCheckedChange={handleChange}
      />,
    );

    fireEvent.click(screen.getByTestId("switch"));

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("uses noop when onCheckedChange is not provided", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(() => {
      fireEvent.click(screen.getByTestId("switch"));
    }).not.toThrow();
  });

  it("disables switch when isDisabled is true", () => {
    render(<NotificationPreferenceCard {...baseProps} isDisabled={true} />);

    expect(screen.getByTestId("switch")).toBeDisabled();
  });

  it("disables switch when loading", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);

    expect(screen.getByTestId("switch")).toBeDisabled();
  });

  it("shows loading text when isLoading is true", () => {
    render(<NotificationPreferenceCard {...baseProps} isLoading={true} />);

    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("does not show loading text when not loading", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
  });

  it("passes error state to switch", () => {
    render(<NotificationPreferenceCard {...baseProps} hasError={true} />);

    expect(screen.getByTestId("error")).toBeInTheDocument();
  });

  it("constructs aria-labelledby with organizationHeadingId", () => {
    render(
      <NotificationPreferenceCard
        {...baseProps}
        organizationHeadingId="org-heading"
      />,
    );

    const ariaLabelledBy = screen.getByTestId("aria-labelledby");

    expect(ariaLabelledBy).toHaveTextContent("org-heading");
    expect(ariaLabelledBy).toHaveTextContent("test-checkbox-label");
  });

  it("does not set aria-labelledby when organizationHeadingId is missing", () => {
    render(<NotificationPreferenceCard {...baseProps} />);

    const ariaLabelledBy = screen.getByTestId("aria-labelledby");

    expect(ariaLabelledBy).toHaveAttribute("data-testid", "aria-labelledby");
  });

  it("passes ariaLabel through when provided", () => {
    render(
      <NotificationPreferenceCard {...baseProps} ariaLabel="Custom label" />,
    );

    expect(screen.getByTestId("switch")).toBeInTheDocument();
  });
});
