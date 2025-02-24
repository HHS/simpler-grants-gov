import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import SearchResultsList from "src/components/search/SearchResultsList";

jest.mock("next-intl/server", () => ({
  // eslint-disable-next-line react-hooks/rules-of-hooks
  getTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  getSavedOpportunities: () => [{ opportunity_id: 1 }],
}));

const makeSearchResults = (overrides = {}) => ({
  status_code: 200,
  data: [],
  pagination_info: {
    order_by: "whatever",
    page_offset: 1,
    page_size: 1,
    sort_direction: "up",
    total_pages: 1,
    total_records: 1,
  },
  message: "",
  ...overrides,
});

const makeOpportunity = (overrides = {}) => ({
  agency: "DMFHDLSKD",
  category: "good",
  category_explanation: "how to explain good",
  created_at: "today",
  opportunity_assistance_listings: [],
  opportunity_id: 1,
  opportunity_number: "111111",
  opportunity_status: "archived",
  opportunity_title: "This Opportunity",
  summary: {
    summary_description: "<p>Summary Description</p>",
    applicant_types: [
      "state_governments",
      "nonprofits_non_higher_education_with_501c3",
      "unknown_type",
    ],
    applicant_eligibility_description: "<p>Eligibility Description</p>",
    agency_contact_description: "<p>Contact Description</p>",
    agency_email_address: "contact@example.com",
    agency_email_address_description: "Contact Email Description",
  },
  updated_at: "today",
  ...overrides,
});

describe("SearchResultsList", () => {
  it("should not have accessibility violations", async () => {
    const component = await SearchResultsList({
      searchResults: makeSearchResults({}),
    });
    const { container } = render(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("renders an error if search results have no data", async () => {
    const component = await SearchResultsList({
      searchResults: makeSearchResults({ status_code: 404 }),
    });
    render(component);
    expect(screen.getByRole("heading")).toHaveTextContent("heading");
  });
  it('renders a "not found" page if no records are passed in', async () => {
    const component = await SearchResultsList({
      searchResults: makeSearchResults({}),
    });
    render(component);
    expect(screen.getByRole("heading")).toHaveTextContent(
      "resultsListFetch.noResultsTitle",
    );
  });
  it("renders an list item for each search result", async () => {
    const component = await SearchResultsList({
      searchResults: makeSearchResults({
        data: [makeOpportunity({}), makeOpportunity({ opportunity_id: 2 })],
      }),
    });
    render(component);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);
  });
  it("shows saved tag", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const component = await SearchResultsList({
      searchResults: makeSearchResults({
        data: [
          makeOpportunity({ opportunity_id: 1 }),
          makeOpportunity({ opportunity_id: 2 }),
        ],
      }),
    });
    render(component);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems[0]).toHaveTextContent("Saved");
    expect(listItems[1]).not.toHaveTextContent("Saved");
  });
});
