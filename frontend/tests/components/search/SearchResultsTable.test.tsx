import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { mockOpportunity } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SearchResultsTable } from "src/components/search/SearchResultsTable";

const mockFetchSavedOpportunities = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: () => mockFetchSavedOpportunities() as unknown,
}));

// this does not directly test responsive aspects of the component, that should be done in e2e tests
// see https://github.com/HHS/simpler-grants-gov/issues/5414
describe("SearchResultsTable", () => {
  beforeEach(() =>
    mockFetchSavedOpportunities.mockResolvedValue([{ opportunity_id: '0bfdd67c-e58a-4005-bfd1-12cfe592b17e' }]),
  );
  afterEach(() => jest.resetAllMocks());
  it("passes accessibility test", async () => {
    const component = await SearchResultsTable({
      searchResults: [mockOpportunity],
    });
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  // skip until we're ready
  it.skip("matches snapshot", async () => {
    const component = await SearchResultsTable({
      searchResults: [mockOpportunity],
    });
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
  it("displays saved search indicator when applicable", async () => {
    const component = await SearchResultsTable({
      searchResults: [
        mockOpportunity,
        { ...mockOpportunity, opportunity_id: '0bfdd67c-e58a-4005-bfd1-12cfe592b17e' },
      ],
    });
    render(component);

    const results = screen.getAllByRole("row");
    expect(results).toHaveLength(3); // first is the header row
    expect(within(results[1]).queryByText("saved")).not.toBeInTheDocument();
    expect(within(results[2]).getByText("saved")).toBeInTheDocument();
  });
  it("displays headings for all columns as expected", async () => {
    const component = await SearchResultsTable({
      searchResults: [mockOpportunity],
    });
    render(component);

    expect(
      screen.getByRole("columnheader", { name: "headings.closeDate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "headings.status" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "headings.title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "headings.agency" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "headings.awardMin" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "headings.awardMax" }),
    ).toBeInTheDocument();
  });
  // note that values for this test also include the header value - this is a remnant of the responsive experience,
  // Jest doesn't know that these header values should be hidden :shrug:
  it("displays data for all columns as expected", async () => {
    const component = await SearchResultsTable({
      searchResults: [
        {
          ...mockOpportunity,
          summary: { ...mockOpportunity.summary, expected_number_of_awards: 1 },
        },
      ],
    });
    render(component);

    const results = screen.getAllByRole("row");
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.closeDate Feb 1, 2023",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.status statuses.posted",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.title Test Opportunity number: OPP-12345",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.agency published : Jan 15, 2023 expectedAwards: 1",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.awardMin $10,000",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.awardMax $50,000",
      }),
    ).toBeInTheDocument();
  });

  it("handles display of empty values", async () => {
    const component = await SearchResultsTable({
      searchResults: [
        {
          ...mockOpportunity,
          summary: {
            ...mockOpportunity.summary,
            close_date: "",
            award_ceiling: null,
            award_floor: null,
          },
        },
      ],
    });
    render(component);

    const results = screen.getAllByRole("row");
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.closeDate tbd",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.agency published : Jan 15, 2023 expectedAwards: --",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.awardMin $--",
      }),
    ).toBeInTheDocument();
    expect(
      within(results[1]).getByRole("cell", {
        name: "headings.awardMax $--",
      }),
    ).toBeInTheDocument();
  });
});
