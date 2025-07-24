import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { mockOpportunity } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SearchResultsTable } from "src/components/search/SearchResultsTable";

// Mock the OpportunitySaveUserControl component
const mockOpportunitySaveUserControl = jest.fn(({ opportunityId }) => (
  <div 
    data-testid={`opportunity-save-control-${opportunityId}`}
    data-opportunity-id={opportunityId}
  >
    Mocked Save Control
  </div>
));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/components/user/OpportunitySaveUserControl", () => ({
  OpportunitySaveUserControl: mockOpportunitySaveUserControl,
}));

// this does not directly test responsive aspects of the component, that should be done in e2e tests
// see https://github.com/HHS/simpler-grants-gov/issues/5414
describe("SearchResultsTable", () => {
  afterEach(() => jest.resetAllMocks());
  
  it("passes accessibility test", async () => {
    const component = await SearchResultsTable({
      searchResults: [mockOpportunity],
      page: 1,
    });
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("matches snapshot", async () => {
    const component = await SearchResultsTable({
      searchResults: [mockOpportunity],
      page: 1,
    });
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  it("renders OpportunitySaveUserControl for each opportunity", async () => {
    const opportunities = [
      mockOpportunity,
      {
        ...mockOpportunity,
        opportunity_id: "second-opportunity-id",
        opportunity_title: "Second Test Opportunity",
      },
    ];

    const component = await SearchResultsTable({
      searchResults: opportunities,
      page: 1,
    });
    render(component);

    // Verify OpportunitySaveUserControl is rendered for each opportunity
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledTimes(2);
    
    // Check first opportunity
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: mockOpportunity.opportunity_id },
      {}
    );
    
    // Check second opportunity
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "second-opportunity-id" },
      {}
    );

    // Verify the components are rendered in the DOM
    expect(screen.getByTestId(`opportunity-save-control-${mockOpportunity.opportunity_id}`)).toBeInTheDocument();
    expect(screen.getByTestId("opportunity-save-control-second-opportunity-id")).toBeInTheDocument();
  });

  it("applies search-table-save-wrapper CSS class to save control containers", async () => {
    const component = await SearchResultsTable({
      searchResults: [mockOpportunity],
      page: 1,
    });
    const { container } = render(component);

    // Check that the search-table-save-wrapper class is applied
    const saveWrappers = container.querySelectorAll('.search-table-save-wrapper');
    expect(saveWrappers).toHaveLength(1);
    
    // Verify the save control is within the wrapper
    const saveWrapper = saveWrappers[0];
    expect(within(saveWrapper as HTMLElement).getByTestId(`opportunity-save-control-${mockOpportunity.opportunity_id}`)).toBeInTheDocument();
  });

  it("displays headings for all columns as expected", async () => {
    const component = await SearchResultsTable({
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
  it("displays data for all columns as expected", async () => {
    const component = await SearchResultsTable({
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
    
    // Updated to include the save control in the title cell
    const titleCell = within(results[1]).getByRole("cell", {
      name: /headings\.title Test Opportunity number: OPP-12345/,
    });
    expect(titleCell).toBeInTheDocument();
    expect(within(titleCell).getByTestId(`opportunity-save-control-${mockOpportunity.opportunity_id}`)).toBeInTheDocument();
    
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

  it("displays a proper message when there are no results", async () => {
    const component = await SearchResultsTable({
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

  it("renders save controls for multiple opportunities with different IDs", async () => {
    const opportunities = [
      { ...mockOpportunity, opportunity_id: "opp-1" },
      { ...mockOpportunity, opportunity_id: "opp-2" },
      { ...mockOpportunity, opportunity_id: "opp-3" },
    ];

    const component = await SearchResultsTable({
      searchResults: opportunities,
      page: 1,
    });
    render(component);

    // Verify all save controls are rendered with unique opportunity IDs
    expect(screen.getByTestId("opportunity-save-control-opp-1")).toBeInTheDocument();
    expect(screen.getByTestId("opportunity-save-control-opp-2")).toBeInTheDocument();
    expect(screen.getByTestId("opportunity-save-control-opp-3")).toBeInTheDocument();

    // Verify all have the search-table-save-wrapper class
    const { container } = render(component);
    const saveWrappers = container.querySelectorAll('.search-table-save-wrapper');
    expect(saveWrappers).toHaveLength(3);
  });

  it("passes correct opportunity ID to each save control component", async () => {
    const opportunities = [
      { ...mockOpportunity, opportunity_id: "unique-id-1" },
      { ...mockOpportunity, opportunity_id: "unique-id-2" },
    ];

    const component = await SearchResultsTable({
      searchResults: opportunities,
      page: 1,
    });
    render(component);

    // Verify that each OpportunitySaveUserControl received the correct opportunity ID
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "unique-id-1" },
      {}
    );
    expect(mockOpportunitySaveUserControl).toHaveBeenCalledWith(
      { opportunityId: "unique-id-2" },
      {}
    );
  });
});
