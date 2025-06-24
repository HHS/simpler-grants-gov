import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import InfoTooltip from "src/components/InfoTooltip";

jest.mock("src/components/TooltipWrapper", () => ({
  DynamicTooltipWrapper: (props: unknown) =>
    // eslint-disable-next-line
    jest.requireActual("src/components/TooltipWrapper").TooltipWrapper(props),
}));

describe("InfoTooltip", () => {
  it("renders with default props", () => {
    render(<InfoTooltip text="Test tooltip" />);
    expect(screen.getByTestId("triggerElement")).toBeInTheDocument();
  });

  it("renders with custom position", () => {
    render(<InfoTooltip text="Test tooltip" position="right" />);
    expect(screen.getByTestId("triggerElement")).toBeInTheDocument();
  });

  it("shows tooltip on hover", async () => {
    const tooltipText = "Test tooltip";
    render(<InfoTooltip text={tooltipText} />);

    const trigger = screen.getByTestId("triggerElement");
    await userEvent.hover(trigger);

    const tooltip = screen.getByTestId("tooltipBody");
    expect(tooltip).toHaveTextContent(tooltipText);
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
