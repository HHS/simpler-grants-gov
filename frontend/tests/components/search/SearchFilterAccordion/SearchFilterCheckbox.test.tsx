import "@testing-library/jest-dom";

import { fireEvent, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { render, screen } from "tests/react-utils";

import React from "react";

import SearchFilterCheckbox from "src/components/search/SearchFilterAccordion/SearchFilterCheckbox";

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
        facetCounts={{}}
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
        facetCounts={{ test: 1 }}
        option={option}
        updateCheckedOption={mockUpdateCheckedOption}
        accordionTitle={"Test Accordion"}
        query={new Set()}
      />,
    );

    // Simulate user clicking the checkbox
    const checkbox = await screen.findByRole("checkbox", {
      name: `${option.label} [1]`,
    });
    fireEvent.click(checkbox);

    // Wait for the updateCheckedOption function to be called with the checkbox being checked
    await waitFor(() => {
      expect(mockUpdateCheckedOption).toHaveBeenCalledWith(option.value, true);
    });
  });
});
