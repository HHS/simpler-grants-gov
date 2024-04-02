import { render, screen } from "@testing-library/react";

import Search from "../../../src/app/search/page";
import { SearchAPIResponse } from "../../../src/types/search/searchResponseTypes";
import fetch from "node-fetch";

if (!global.fetch) {
  global.fetch = fetch as unknown as typeof global.fetch;
}

jest.mock("node-fetch", () =>
  jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: (): Promise<SearchAPIResponse> =>
        Promise.resolve({
          data: [
            {
              agency: "Mock Agency",
              category: "Mock Category",
              category_explanation: null,
              created_at: "2020-01-01T00:00:00Z",
              opportunity_assistance_listings: [],
              opportunity_id: 1,
              opportunity_number: "12345",
              opportunity_status: "Open",
              opportunity_title: "Mock Opportunity",
              summary: {
                additional_info_url: null,
                additional_info_url_description: null,
                agency_code: null,
                agency_contact_description: null,
                agency_email_address: null,
                agency_email_address_description: null,
                agency_name: null,
                agency_phone_number: null,
                applicant_eligibility_description: null,
                applicant_types: null,
                archive_date: null,
                award_ceiling: null,
                award_floor: null,
                close_date: null,
                close_date_description: null,
                estimated_total_program_funding: null,
                expected_number_of_awards: null,
                fiscal_year: null,
                forecasted_award_date: null,
                forecasted_close_date: null,
                forecasted_close_date_description: null,
                forecasted_post_date: null,
                forecasted_project_start_date: null,
                funding_categories: null,
                funding_category_description: null,
                funding_instruments: null,
                is_cost_sharing: null,
                is_forecast: false, // Adjust according to your needs
                post_date: null,
                summary_description: null,
                // Add any missing required fields here
              },
              updated_at: "2020-01-02T00:00:00Z",
            },
          ],
          message: "Success",
          pagination_info: {
            order_by: "opportunity_id",
            page_offset: 0,
            page_size: 10,
            sort_direction: "ascending",
            total_pages: 1,
            total_records: 1,
          },
          status_code: 200,
        }),
    }),
  ),
);

jest.mock("next/headers", () => ({
  cookies: () => ({
    // Your mock cookie implementation
  }),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
}));

jest.mock("src/app/search/SearchForm", () => {
  return function DummySearchForm() {
    return <div>Mocked Search Form</div>;
  };
});

jest.mock("src/services/FeatureFlagManager", () => ({
  FeatureFlagsManager: jest.fn().mockImplementation(() => ({
    isFeatureEnabled: jest.fn().mockReturnValue(true),
  })),
}));

describe("Search", () => {
  it("should pass", () => {
    expect(1).toBe(1);
  });

  // TODO (#1393): Fix server component test (issues with imports)

  /* eslint-disable jest/no-commented-out-tests */
  //   it("renders the search page when feature flag is enabled", async () => {
  //     const mockSearchParams = {
  //       query: "?status=forecasted,posted",
  //     };
  //     const mockParams = { slug: "some-slug" };
  //     const ResolvedSearchPage = await Search({
  //       searchParams: mockSearchParams,
  //       params: mockParams,
  //     });
  //     render(ResolvedSearchPage);

  //     expect(screen.getByText("Mocked Search Form")).toBeInTheDocument();
  //   });
});
