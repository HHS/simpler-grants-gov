import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoTooltip from "src/components/InfoTooltip";

describe("InfoTooltip", () => {
    it("renders with default props", () => {
        render(<InfoTooltip text="Test tooltip" />);
        expect(screen.getByTestId("triggerElement")).toBeInTheDocument();
    });

    it("renders with custom position", () => {
        render(<InfoTooltip text="Test tooltip" position="right" />);
        expect(screen.getByTestId("triggerElement")).toBeInTheDocument();
    });

    it("applies custom className", () => {
        const customClass = "custom-class";
        render(<InfoTooltip text="Test tooltip" className={customClass} />);
        const tooltipWrapper = screen.getByTestId("tooltipWrapper");
        expect(tooltipWrapper).toHaveClass("usa-tooltip");
        expect(tooltipWrapper).toHaveClass(customClass);
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
        expect(screen.getByTestId("triggerElement")).toHaveStyle({ cursor: "help" });
    });
}); 