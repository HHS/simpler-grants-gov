import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import React, { useState } from "react";

import InfoTooltip from "src/components/InfoTooltip";

type TriggerProps = React.HTMLAttributes<HTMLSpanElement> & {
  "data-testid"?: string;
};

type MockDynamicTooltipWrapperProps = {
  asCustom: React.ComponentType<TriggerProps>;
  label: React.ReactNode;
  position?: string;
} & Record<string, unknown>;

jest.mock("src/components/TooltipWrapper", () => ({
  DynamicTooltipWrapper: ({
    asCustom: AsCustom,
    label,
    position,
    ...rest
  }: MockDynamicTooltipWrapperProps) => {
    const [open, setOpen] = useState(false);

    return (
      <div data-testid="tooltipWrapper" data-position={position} {...rest}>
        <AsCustom
          data-testid="triggerElement"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        />
        {open ? <div data-testid="tooltipBody">{label}</div> : null}
      </div>
    );
  },
}));

describe("InfoTooltip", () => {
  it("renders with default props", () => {
    render(<InfoTooltip text="Test tooltip" />);
    expect(screen.getByTestId("triggerElement")).toBeInTheDocument();
  });

  it("renders with custom position", () => {
    render(<InfoTooltip text="Test tooltip" position="right" />);
    expect(screen.getByTestId("tooltipWrapper")).toHaveAttribute(
      "data-position",
      "right",
    );
  });

  it("shows tooltip on hover", async () => {
    const user = userEvent.setup();
    const tooltipText = "Test tooltip";

    render(<InfoTooltip text={tooltipText} />);

    const trigger = screen.getByTestId("triggerElement");

    expect(screen.queryByTestId("tooltipBody")).not.toBeInTheDocument();

    await user.hover(trigger);
    expect(screen.getByTestId("tooltipBody")).toHaveTextContent(tooltipText);

    await user.unhover(trigger);
    expect(screen.queryByTestId("tooltipBody")).not.toBeInTheDocument();
  });

  it("has correct text styling", () => {
    render(<InfoTooltip text="Test tooltip" />);
    expect(screen.getByTestId("triggerElement")).toHaveClass("text-secondary");
  });

  it("has help cursor style", () => {
    render(<InfoTooltip text="Test tooltip" />);
    expect(screen.getByTestId("triggerElement")).toHaveStyle({
      cursor: "help",
    });
  });
});
