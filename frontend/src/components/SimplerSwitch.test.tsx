import { fireEvent, render, screen } from "@testing-library/react";

import { SimplerSwitch } from "./SimplerSwitch";

describe("SimplerSwitch", () => {
  const baseProps = {
    id: "test-switch",
    checked: false,
    onCheckedChange: jest.fn(),
    ariaLabel: "Test switch",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders a checkbox with role switch", () => {
    render(<SimplerSwitch {...baseProps} />);
    const input = screen.getByRole("switch");
    expect(input).toBeInTheDocument();
  });

  it("throws error if no accessible name is provided", () => {
    expect(() =>
      render(
        <SimplerSwitch
          id="bad-switch"
          checked={false}
          onCheckedChange={jest.fn()}
        />,
      ),
    ).toThrow();
  });

  it("calls onCheckedChange when toggled", () => {
    render(<SimplerSwitch {...baseProps} />);
    const input = screen.getByRole("switch");

    fireEvent.click(input);
    expect(baseProps.onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("reflects checked state", () => {
    render(<SimplerSwitch {...baseProps} checked={true} />);
    const input = screen.getByRole("switch");

    expect(input).toBeChecked();
  });

  it("is disabled when disabled prop is true", () => {
    render(<SimplerSwitch {...baseProps} disabled />);
    const input = screen.getByRole("switch");

    expect(input).toBeDisabled();
  });

  it("applies aria-invalid when hasError is true", () => {
    render(<SimplerSwitch {...baseProps} hasError />);
    const input = screen.getByRole("switch");

    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows state text when enabled", () => {
    render(
      <SimplerSwitch
        {...baseProps}
        showStateText
        checked={true}
        onText="Enabled"
        offText="Disabled"
      />,
    );

    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("does not show state text when disabled", () => {
    render(<SimplerSwitch {...baseProps} showStateText={false} />);
    expect(screen.queryByText(/on|off/i)).not.toBeInTheDocument();
  });

  it("supports aria-labelledby", () => {
    render(
      <>
        <span id="label-id">Label</span>
        <SimplerSwitch
          {...baseProps}
          ariaLabel={undefined}
          ariaLabelledBy="label-id"
        />
      </>,
    );

    const input = screen.getByRole("switch");
    expect(input).toHaveAttribute("aria-labelledby", "label-id");
  });
});
