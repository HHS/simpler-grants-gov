import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { mockOpportunity } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SearchResultsTable } from "src/components/search/SearchResultsTable";
import { OpportunitySaveUserControl } from "src/components/user/OpportunitySaveUserControl";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/components/user/OpportunitySaveUserControl", () => ({
  OpportunitySaveUserControl: jest
    .fn()
    .mockImplementation(
      ({ opportunityId, type }: { opportunityId: string; type?: string }) => {
        return (
          <div
            data-testid={`opportunity-save-control-${opportunityId}`}
            data-opportunity-id={opportunityId}
            data-type={type || "button"}
          >
            {`Mocked Save Control for ${opportunityId} (${type || "button"})`}
          </div>
        );
      },
    ),
}));

// this does not directly test responsive aspects of the component, that should be done in e2e tests
// see https://github.com/HHS/simpler-grants-gov/issues/5414
describe("SearchResultsTable", () => {
  const mockOpportunitySaveUserControl = jest.mocked(
    OpportunitySaveUserControl,
  );

  afterEach(() => jest.resetAllMocks());

  it("passes accessibility test", async () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: [mockOpportunity],
      page: 1,
    });
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders a table with header + one result row", () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: [mockOpportunity],
      page: 1,
    });

    render(component);

    // header row + one data row
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThanOrEqual(2);

    // sanity check: a known heading exists
    expect(
      screen.getByRole("columnheader", { name: "headings.title" }),
    ).toBeInTheDocument();

    // sanity check: the opportunity title link exists
    const title = mockOpportunity.opportunity_title ?? "Test Opportunity";
    expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
  });

  it("renders OpportunitySaveUserControl for each opportunity", () => {
    const opportunities = [
      mockOpportunity,
      {
        ...mockOpportunity,
        opportunity_id: "second-opportunity-id",
        opportunity_title: "Second Test Opportunity",
      },
    ];

    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: opportunities,
      page: 1,
    });
    render(component);

    // Verify the mock component was called for each opportunity
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledTimes(2);
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      {
        opportunityId: mockOpportunity.opportunity_id,
        type: "icon",
        opportunitySaved: false,
      },
      undefined,
    );
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      {
        opportunityId: "second-opportunity-id",
        type: "icon",
        opportunitySaved: false,
      },
      undefined,
    );
  });

  it("renders save control in correct layout structure", () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: [mockOpportunity],
      page: 1,
    });
    const { container } = render(component);

    // Check that the wrapper div with new layout classes exists
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const wrapper = container.querySelector(
      ".margin-y-auto.grid-col-auto.minw-4",
    );
    expect(wrapper).toBeInTheDocument();

    // Verify the mock was called
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      {
        opportunityId: mockOpportunity.opportunity_id,
        type: "icon",
        opportunitySaved: false,
      },
      undefined,
    );
  });

  it("displays headings for all columns as expected", () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: [mockOpportunity],
      page: 1,
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
  it("displays data for all columns as expected", () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: [
        {
          ...mockOpportunity,
          summary: { ...mockOpportunity.summary, expected_number_of_awards: 1 },
        },
      ],
      page: 1,
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

    const titleCell = within(results[1]).getByRole("cell", {
      name: /headings\.title Test Opportunity number: OPP-12345/,
    });
    expect(titleCell).toBeInTheDocument();

    // Verify that the save control component was called for this opportunity
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      {
        opportunityId: mockOpportunity.opportunity_id,
        type: "icon",
        opportunitySaved: false,
      },
      undefined,
    );

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

  it("handles display of empty values", () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
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
      page: 1,
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

  it("displays a proper message when there are no results", () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: [],
      page: 1,
    });
    render(component);
    expect(screen.queryAllByRole("row")).toHaveLength(0);
    expect(
      screen.getByRole("heading", {
        name: "title",
      }),
    ).toBeInTheDocument();
  });

  it("renders save controls for multiple opportunities with different IDs", () => {
    const opportunities = [
      { ...mockOpportunity, opportunity_id: "opp-1" },
      { ...mockOpportunity, opportunity_id: "opp-2" },
      { ...mockOpportunity, opportunity_id: "opp-3" },
    ];

    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: opportunities,
      page: 1,
    });
    const { container } = render(component);

    // Verify correct number of mock calls
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledTimes(3);

    // Verify correct number of wrapper divs
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const wrappers = container.querySelectorAll(
      ".margin-y-auto.grid-col-auto.minw-4",
    );
    expect(wrappers).toHaveLength(3);

    // Verify each opportunity ID was called
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "opp-1", type: "icon", opportunitySaved: false },
      undefined,
    );
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "opp-2", type: "icon", opportunitySaved: false },
      undefined,
    );
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "opp-3", type: "icon", opportunitySaved: false },
      undefined,
    );
  });

  it("passes correct opportunity ID to each save control component", () => {
    const opportunities = [
      { ...mockOpportunity, opportunity_id: "unique-id-1" },
      { ...mockOpportunity, opportunity_id: "unique-id-2" },
    ];

    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: opportunities,
      page: 1,
    });
    render(component);

    // Check that the mock was called with the correct parameters
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledTimes(2);

    // Check that the mock was called with the correct opportunity IDs
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "unique-id-1", type: "icon", opportunitySaved: false },
      undefined,
    );
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "unique-id-2", type: "icon", opportunitySaved: false },
      undefined,
    );
  });

  it("passes type='icon' to OpportunitySaveUserControl components", () => {
    const component = SearchResultsTable({
      savedOpportunities: [],
      searchResults: [mockOpportunity],
      page: 1,
    });
    render(component);

    // Verify that type="icon" was passed to the component
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      {
        opportunityId: mockOpportunity.opportunity_id,
        type: "icon",
        opportunitySaved: false,
      },
      undefined,
    );
  });

  it("correctly determines previously saved opportunities", () => {
    const component = SearchResultsTable({
      savedOpportunities: [mockOpportunity],
      searchResults: [
        mockOpportunity,
        { ...mockOpportunity, opportunity_id: "unsaved-id" },
      ],
      page: 1,
    });
    render(component);

    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      {
        opportunityId: mockOpportunity.opportunity_id,
        type: "icon",
        opportunitySaved: true,
      },
      undefined,
    );
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      {
        opportunityId: "unsaved-id",
        type: "icon",
        opportunitySaved: false,
      },
      undefined,
    );
  });
});
