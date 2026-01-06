import "@testing-library/jest-dom";

import { axe } from "jest-axe";
import type { FilterOption } from "src/types/search/searchFilterTypes";
import type { ValidSearchQueryParam } from "src/types/search/searchQueryTypes";
import { render, screen } from "tests/react-utils";

import React, { JSX } from "react";

type AllOptionCheckboxProps = {
  title: string;
  currentSelections: Set<string>;
  childOptions: FilterOption[];
  queryParamKey: ValidSearchQueryParam;
  topLevelQueryParamKey?: string;
  topLevelQuery?: Set<string>;
  topLevelQueryValue?: string;
};

const AllOptionCheckboxMock = jest.fn<JSX.Element, [AllOptionCheckboxProps]>(
  () => <div data-testid="all-option-checkbox" />,
);

jest.mock(
  "src/components/search/SearchFilterAccordion/AllOptionCheckbox",
  () => ({
    AllOptionCheckbox: (props: AllOptionCheckboxProps) =>
      AllOptionCheckboxMock(props),
  }),
);

const mockSetQueryParam = jest.fn();
jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({ setQueryParam: mockSetQueryParam }),
}));

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
  query: new Set<string>(),
  facetCounts: {
    "1st-child-value": 1,
    "2nd-child-value": 2,
  },
};

async function loadSearchFilterSection() {
  const mod = await import("./SearchFilterSection");
  return mod.default;
}

describe("SearchFilterSection", () => {
  afterEach(() => {
    jest.resetModules(); // ensures next test re-imports with mocks applied
    jest.clearAllMocks();
  });

  it("should not have accessibility violations", async () => {
    const SearchFilterSection = await loadSearchFilterSection();
    const { container } = render(<SearchFilterSection {...defaultProps} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders select-all control and a checkbox for each child", async () => {
    const SearchFilterSection = await loadSearchFilterSection();
    render(<SearchFilterSection {...defaultProps} />);

    expect(screen.getByTestId("all-option-checkbox")).toBeInTheDocument();

    expect(
      screen.getByRole("checkbox", { name: /^Child 1\b/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /^Child 2\b/ }),
    ).toBeInTheDocument();

    expect(AllOptionCheckboxMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Option 1",
        queryParamKey: "agency",
        currentSelections: defaultProps.query,
        topLevelQueryValue: "some value",
      }),
    );
  });
});
