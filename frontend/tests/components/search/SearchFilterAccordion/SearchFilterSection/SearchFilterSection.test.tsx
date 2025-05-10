import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import { render, screen } from "tests/react-utils";

import React from "react";

import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection/SearchFilterSection";

const mockSetQueryParam = jest.fn();

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
  updateCheckedOption: jest.fn(),
  accordionTitle: "Default Title",
  query: new Set(""),
  facetCounts: {
    "1st-child-value": 1,
    "2nd-child-value": 2,
  },
};

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
  }),
}));

describe("SearchFilterSection", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<SearchFilterSection {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("displays select all checkbox and checkbox for each child", () => {
    render(<SearchFilterSection {...defaultProps} />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });
});
