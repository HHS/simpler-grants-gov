import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  filterOptionsWithChildren,
  initialFilterOptions,
} from "src/utils/testing/fixtures";

import { AgencyFilterBody } from "src/components/search/Filters/AgencyFilterBody";

const fakeFacetCounts = {
  grant: 1,
  other: 1,
  procurement_contract: 1,
  cooperative_agreement: 1,
};

const mockUpdateQueryParams = jest.fn();
const mockSetQueryParams = jest.fn();

const title = "Test Accordion";
const queryParamKey = "fundingInstrument";

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
    setQueryParams: mockSetQueryParams,
  }),
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useContext: () => ({
    queryTerm: "query term",
  }),
}));

describe("AgencyFilterBody", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("adds an any option checkbox when specified", () => {
    render(
      <AgencyFilterBody
        includeAnyOption={true}
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
        facetCounts={fakeFacetCounts}
      />,
    );
    const anyCheckbox = screen.getByRole("checkbox", {
      name: "any test accordion",
    });
    expect(anyCheckbox).toBeInTheDocument();
  });
  it("displays filter section children when present", () => {
    render(
      <AgencyFilterBody
        includeAnyOption={true}
        filterOptions={filterOptionsWithChildren}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
        facetCounts={{}}
      />,
    );
    const childCheckbox = screen.getByRole("checkbox", {
      name: "Hello [0]",
    });
    expect(childCheckbox).toBeInTheDocument();
  });
  it("correctly toggles a checkbox (simple)", async () => {
    render(
      <AgencyFilterBody
        includeAnyOption={true}
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
        facetCounts={fakeFacetCounts}
      />,
    );
    const otherCheckbox = screen.getByRole("checkbox", {
      name: "Other [1]",
    });
    expect(otherCheckbox).toBeInTheDocument();

    await userEvent.click(otherCheckbox);

    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      new Set(["other"]),
      "agency",
      "query term",
    );
  });
  it("correctly toggles a checkbox (unchecking with parent selected)", async () => {
    render(
      <AgencyFilterBody
        includeAnyOption={true}
        filterOptions={filterOptionsWithChildren}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
        facetCounts={fakeFacetCounts}
        topLevelQuery={new Set(["AGNC"])}
      />,
    );
    const previouslyCheckedChildCheckbox = screen.getByRole("checkbox", {
      name: "Kid [0]",
    });
    expect(previouslyCheckedChildCheckbox).toBeInTheDocument();
    expect(previouslyCheckedChildCheckbox).toBeChecked();

    await userEvent.click(previouslyCheckedChildCheckbox);

    expect(mockUpdateQueryParams).not.toHaveBeenCalled();

    expect(mockSetQueryParams).toHaveBeenCalledWith({
      agency: "AGNC-CHILD",
      topLevelAgency: "",
      query: "query term",
    });
  });
});
