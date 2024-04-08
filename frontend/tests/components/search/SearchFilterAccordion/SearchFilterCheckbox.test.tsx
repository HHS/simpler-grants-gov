import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import React from "react";
import SearchFilterCheckbox from "../../../../src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import { axe } from "jest-axe";

const mockIncrement = jest.fn();
const mockDecrement = jest.fn();
const mockUpdateCheckedOption = jest.fn();
const option = {
  id: "test-option",
  label: "Test Option",
  value: "test",
  isChecked: false,
};
describe("SearchFilterCheckbox", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchFilterCheckbox
        option={option}
        increment={mockIncrement}
        decrement={mockDecrement}
        mounted={true}
        updateCheckedOption={mockUpdateCheckedOption}
        accordionTitle={"Test Accordion"}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("calls the appropriate handlers when the checkbox is clicked", async () => {
    render(
      <SearchFilterCheckbox
        option={option}
        increment={mockIncrement}
        decrement={mockDecrement}
        mounted={true}
        updateCheckedOption={mockUpdateCheckedOption}
        accordionTitle={"Test Accordion"}
      />,
    );

    // Simulate user clicking the checkbox
    const checkbox = screen.getByLabelText(option.label);
    fireEvent.click(checkbox);

    // Wait for the increment function to be called
    await waitFor(() => {
      expect(mockIncrement).toHaveBeenCalledTimes(1);
    });

    // Wait for the updateCheckedOption function to be called with the checkbox being checked
    await waitFor(() => {
      expect(mockUpdateCheckedOption).toHaveBeenCalledWith(option.id, true);
    });

    // Simulate user clicking the checkbox again to uncheck it
    fireEvent.click(checkbox);

    // TODO (Issue #1618): Resolve issues with unchecking

    // await waitFor(() => {
    //   expect(mockDecrement).toHaveBeenCalledTimes(1);
    // });

    // // Wait for the updateCheckedOption function to be called with the checkbox being unchecked
    // await waitFor(() => {
    //   expect(mockUpdateCheckedOption).toHaveBeenCalledWith(option.id, false);
    // });
  });
});
