import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import React from "react";
import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";
import { axe } from "jest-axe";

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
        updateCheckedOption={mockUpdateCheckedOption}
        accordionTitle={"Test Accordion"}
        query={new Set()}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("calls the appropriate handlers when the checkbox is clicked", async () => {
    render(
      <SearchFilterCheckbox
        option={option}
        updateCheckedOption={mockUpdateCheckedOption}
        accordionTitle={"Test Accordion"}
        query={new Set()}
      />,
    );

    // Simulate user clicking the checkbox
    const checkbox = screen.getByLabelText(option.label);
    fireEvent.click(checkbox);

    // Wait for the updateCheckedOption function to be called with the checkbox being checked
    await waitFor(() => {
      expect(mockUpdateCheckedOption).toHaveBeenCalledWith(option.value, true);
    });
  });
});
