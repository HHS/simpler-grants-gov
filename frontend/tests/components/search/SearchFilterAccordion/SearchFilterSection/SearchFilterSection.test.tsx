import "@testing-library/jest-dom";

import { fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { render, screen } from "tests/react-utils";

import React from "react";

import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";

const isSectionAllSelected = (
  allSelected: Set<string>,
  query: Set<string>,
): boolean => {
  if (allSelected && query) {
    return false;
  }
  return true;
};
const isSectionNoneSelected = (query: Set<string>): boolean => {
  if (query) {
    return false;
  }
  return true;
};
const defaultProps = {
  isSectionAllSelected,
  isSectionNoneSelected,
  option: {
    id: "1",
    label: "Option 1",
    value: "some value",
    children: [
      {
        id: "1-1",
        label: "Child 1",
        isChecked: false,
        value: "1st-child-value",
      },
      {
        id: "1-2",
        label: "Child 2",
        isChecked: true,
        value: "2nd-child-value",
      },
    ],
  },
  incrementTotal: jest.fn(),
  decrementTotal: jest.fn(),
  updateCheckedOption: jest.fn(),
  toggleSelectAll: jest.fn(),
  accordionTitle: "Default Title",
  query: new Set(""),
  value: "",
  facetCounts: {
    "1st-child-value": 1,
    "2nd-child-value": 2,
  },
};

describe("SearchFilterSection", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<SearchFilterSection {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("toggles children visibility on button click", () => {
    render(<SearchFilterSection {...defaultProps} />);

    // Section is collapsed on not visible
    expect(screen.queryByText("Select All")).not.toBeInTheDocument();
    expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Child 1" }),
    ).not.toBeInTheDocument();

    // uncollapse section
    fireEvent.click(screen.getByRole("button"));

    // Toggle all links and checkbox appear
    expect(screen.getByText("Select All")).toBeInTheDocument();
    expect(screen.getByText("Clear All")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Child 1 [1]" }),
    ).toBeInTheDocument();
  });

  it("renders hidden inputs for checked children when collapsed", () => {
    // checkbox "1-2" is checked, but when the section is collapsed we still need to send the value
    // to the form to submit, so we use a hidden input. It must be present.
    render(<SearchFilterSection {...defaultProps} />);
    const hiddenInput = screen.getByDisplayValue("on");
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute("name", "1-2");
  });
  it("does not render if there are no children with facetCounts > 0", () => {
    render(
      <SearchFilterSection
        {...defaultProps}
        facetCounts={{
          "1st-child-value": 0,
          "2nd-child-value": 0,
        }}
      />,
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
