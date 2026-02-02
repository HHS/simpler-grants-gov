import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import { ValidSearchQueryParam } from "src/types/search/searchQueryTypes";
import { render, screen } from "tests/react-utils";

import React from "react";

import * as AllOptionCheckboxImport from "src/components/search/SearchFilterAccordion/AllOptionCheckbox";
import SearchFilterSection from "src/components/search/SearchFilterAccordion/SearchFilterSection";

// const AllOptionCheckboxMock = jest.fn();

// jest.mock(
//   "src/components/search/SearchFilterAccordion/AllOptionCheckbox",
//   () => ({
//     AllOptionCheckbox: (props: unknown) =>
//       AllOptionCheckboxMock(props) as unknown,
//   }),
// );

const mockSetQueryParam = jest.fn();

jest.spyOn(AllOptionCheckboxImport, "AllOptionCheckbox");

const defaultProps = {
  queryParamKey: "agency" as ValidSearchQueryParam,
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

// const ActualAllOptionCheckbox = jest.requireActual<
//   typeof import("src/components/search/SearchFilterAccordion/AllOptionCheckbox")
// >("src/components/search/SearchFilterAccordion/AllOptionCheckbox");

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
  }),
}));

describe("SearchFilterSection", () => {
  // beforeEach(() => {
  //   AllOptionCheckboxMock.mockImplementation((props) =>
  //     ActualAllOptionCheckbox.AllOptionCheckbox(props),
  //   );
  // });
  afterEach(() => jest.resetAllMocks());
  it("should not have accessibility violations", async () => {
    const { container } = render(<SearchFilterSection {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("displays select all checkbox and checkbox for each child", () => {
    render(<SearchFilterSection {...defaultProps} />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });
  it("passes referenceOption to AllOptionCheckbox when available", () => {
    render(
      <SearchFilterSection
        {...defaultProps}
        referenceOption={{
          id: "2",
          label: "Option 2",
          value: "some value 2",
          children: [
            {
              id: "2-1",
              label: "Child 3",
              isChecked: false,
              value: "1st-child-value",
            },
            {
              id: "2-2",
              label: "Child 4",
              isChecked: true,
              value: "2nd-child-value",
            },
          ],
        }}
      />,
    );

    expect(AllOptionCheckboxMock).toHaveBeenCalledWith({
      title: "Option 1",
      queryParamKey: "agency",
      childOptions: [
        {
          id: "2-1",
          label: "Child 3",
          isChecked: false,
          value: "1st-child-value",
        },
        {
          id: "2-2",
          label: "Child 4",
          isChecked: true,
          value: "2nd-child-value",
        },
      ],
      currentSelections: new Set(""),
      topLevelQuery: undefined,
      topLevelQueryParamKey: undefined,
      topLevelQueryValue: "some value",
    });
  });
});
