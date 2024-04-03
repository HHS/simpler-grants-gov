import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import React from "react";
import SearchFilterSection from "../../../../../src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";
import { axe } from "jest-axe";

const defaultProps = {
  option: {
    id: "1",
    label: "Option 1",
    value: "some value",
    children: [
      {
        id: "1-1",
        label: "Child 1",
        isChecked: false,
        value: "1st child value",
      },
      {
        id: "1-2",
        label: "Child 2",
        isChecked: true,
        value: "2nd child value",
      },
    ],
  },
  incrementTotal: jest.fn(),
  decrementTotal: jest.fn(),
  mounted: true,
  updateCheckedOption: jest.fn(),
  toggleSelectAll: jest.fn(),
  accordionTitle: "Default Title",
  isSectionAllSelected: false,
  isSectionNoneSelected: true,
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
      screen.getByRole("checkbox", { name: "Child 1" }),
    ).toBeInTheDocument();
  });

  it("correctly updates the section count", async () => {
    // Render the component with default props
    render(<SearchFilterSection {...defaultProps} />);

    // Just 1 is checked initially, so count should be 1
    const countSpanAsOne = screen.getByText("1", { selector: ".usa-tag" });
    expect(countSpanAsOne).toBeInTheDocument();

    // uncollapse section
    fireEvent.click(screen.getByRole("button"));

    // Check the 1st box in the section
    const checkboxForChild1 = screen.getByLabelText("Child 1");
    fireEvent.click(checkboxForChild1);

    await waitFor(() => {
      // count should now be 2
      expect(
        screen.getByText("2", { selector: ".usa-tag" }),
      ).toBeInTheDocument();
    });
  });

  it("renders hidden inputs for checked children when collapsed", () => {
    // checkbox "1-2" is checked, but when the section is collapsed we still need to send the value
    // to the form to submit, so we use a hidden input. It must be present.
    render(<SearchFilterSection {...defaultProps} />);
    const hiddenInput = screen.getByDisplayValue("on");
    expect(hiddenInput).toBeInTheDocument();
    expect(hiddenInput).toHaveAttribute("name", "1-2");
  });
});
