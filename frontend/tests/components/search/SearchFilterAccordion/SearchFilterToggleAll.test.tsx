import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import React from "react";
import SearchFilterToggleAll from "../../../../src/components/search/SearchFilterAccordion/SearchFilterToggleAll";
import { axe } from "jest-axe";

describe("SearchFilterToggleAll", () => {
  const mockOnSelectAll = jest.fn();
  const mockOnClearAll = jest.fn();

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchFilterToggleAll
        onSelectAll={mockOnSelectAll}
        onClearAll={mockOnClearAll}
        isAllSelected={false}
        isNoneSelected={false}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('calls onSelectAll when "Select All" is clicked', () => {
    render(
      <SearchFilterToggleAll
        onSelectAll={mockOnSelectAll}
        onClearAll={mockOnClearAll}
        isAllSelected={false}
        isNoneSelected={false}
      />,
    );

    const selectAllButton = screen.getByText("Select All");
    fireEvent.click(selectAllButton);
    expect(mockOnSelectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onClearAll when "Clear All" is clicked', () => {
    render(
      <SearchFilterToggleAll
        onSelectAll={mockOnSelectAll}
        onClearAll={mockOnClearAll}
        isAllSelected={false}
        isNoneSelected={false}
      />,
    );

    const clearAllButton = screen.getByText("Clear All");
    fireEvent.click(clearAllButton);
    expect(mockOnClearAll).toHaveBeenCalledTimes(1);
  });

  it('disables "Select All" button when all items are selected', () => {
    render(
      <SearchFilterToggleAll
        onSelectAll={mockOnSelectAll}
        onClearAll={mockOnClearAll}
        isAllSelected={true}
        isNoneSelected={false}
      />,
    );

    const selectAllButton = screen.getByText("Select All");
    expect(selectAllButton).toBeDisabled();
  });

  it('disables "Clear All" button when no items are selected', () => {
    render(
      <SearchFilterToggleAll
        onSelectAll={mockOnSelectAll}
        onClearAll={mockOnClearAll}
        isAllSelected={false}
        isNoneSelected={true}
      />,
    );

    const clearAllButton = screen.getByText("Clear All");
    expect(clearAllButton).toBeDisabled();
  });
});
