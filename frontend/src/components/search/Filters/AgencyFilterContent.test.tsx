import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { FilterOption } from "src/types/search/searchFilterTypes";

import { AgencyFilterContent } from "src/components/search/Filters/AgencyFilterContent";

const mockAgencySearch = jest.fn();
const mockUpdateQueryParams = jest.fn();

jest.mock("lodash", () => ({
  debounce: (fn: unknown) => fn,
}));

jest.mock("src/services/fetch/fetchers/clientAgenciesFetcher", () => ({
  agencySearch: (...args: unknown[]) => mockAgencySearch(...args) as unknown,
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

const allAgencies: FilterOption[] = [
  { value: "agency1", label: "Agency 1", id: "1" },
  { value: "agency2", label: "Agency 2", id: "2" },
];

const facetCounts = { agency1: 5, agency2: 2 };
const query = new Set<string>();
const selectedStatuses = ["posted", "closed"];

describe("AgencyFilterContent", () => {
  beforeEach(() => {
    mockAgencySearch.mockResolvedValue([
      { agency_code: "agency1", agency_name: "Agency 1", agency_id: "1" },
    ]);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the TextInput and CheckboxFilterBody with all agencies by default", () => {
    render(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("Agency 1")).toBeInTheDocument();
    expect(screen.getByText("Agency 2")).toBeInTheDocument();
  });

  it("calls agencySearch when user types in the TextInput", async () => {
    render(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "NASA" } });

    await waitFor(() => {
      expect(mockAgencySearch).toHaveBeenCalledWith("NASA", selectedStatuses);
    });
  });

  it("shows search results returned by agencySearch", async () => {
    const { rerender } = render(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );
    expect(screen.getByText("Agency 1")).toBeInTheDocument();
    expect(screen.getByText("Agency 2")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "garbage" } });

    rerender(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Agency 2")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Agency 1")).toBeInTheDocument();
  });

  it("shows FilterSearchNoResults when agencySearch returns empty array", async () => {
    mockAgencySearch.mockResolvedValue([]);
    render(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "garbage" } });

    await waitFor(() => {
      expect(screen.getByText("suggestions.0")).toBeInTheDocument();
    });
  });

  it("restores all agencies when input is cleared", async () => {
    render(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "garbage" } });
    await waitFor(() => {
      expect(mockAgencySearch).toHaveBeenCalledWith(
        "garbage",
        selectedStatuses,
      );
    });

    fireEvent.change(input, { target: { value: "" } });

    await waitFor(() => {
      expect(screen.getByText("Agency 1")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Agency 2")).toBeInTheDocument();
    });
  });

  it("handles agencySearch rejection gracefully", async () => {
    mockAgencySearch.mockRejectedValue(new Error("Network error"));
    const { rerender } = render(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "garbage" } });

    rerender(
      <AgencyFilterContent
        topLevelQuery={new Set()}
        query={query}
        title="Agencies"
        allAgencies={allAgencies}
        facetCounts={facetCounts}
        selectedStatuses={selectedStatuses}
      />,
    );

    // Should not throw, and fall back to show all agencies
    await waitFor(() => {
      expect(screen.getByText("Agency 1")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("Agency 2")).toBeInTheDocument();
    });
  });
});
