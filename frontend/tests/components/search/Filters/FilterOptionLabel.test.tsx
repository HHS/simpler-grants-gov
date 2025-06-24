import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { FilterOptionLabel } from "src/components/search/Filters/FilterOptionLabel";

describe("FilterOptionLabel", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <FilterOptionLabel
        option={{
          label: "this label",
          value: "value",
          id: "this id",
          tooltip: "tooltip text",
        }}
        facetCounts={{
          value: 1,
        }}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("displays option label", () => {
    render(
      <FilterOptionLabel
        option={{
          label: "this label",
          value: "value",
          id: "this id",
        }}
      />,
    );
    expect(screen.getByText("this label")).toBeInTheDocument();
  });
  it("displays facet count if provided", () => {
    render(
      <FilterOptionLabel
        option={{
          label: "this label",
          value: "value",
          id: "this id",
        }}
        facetCounts={{
          value: 1,
        }}
      />,
    );
    expect(screen.getByText("[1]")).toBeInTheDocument();
  });
  it("displays tooltip on hover if provided", async () => {
    render(
      <FilterOptionLabel
        option={{
          label: "this label",
          value: "value",
          id: "this id",
          tooltip: "tooltip text",
        }}
      />,
    );
    const trigger = await screen.findByTestId("triggerElement");
    expect(trigger).toBeInTheDocument();
    const tooltip = await screen.findByTestId("tooltipBody");
    expect(tooltip).toHaveAttribute("aria-hidden", "true");

    await userEvent.hover(trigger);

    expect(tooltip).toHaveAttribute("aria-hidden", "false");
    expect(tooltip).toHaveTextContent("tooltip text");
  });
});
