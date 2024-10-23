import OpportunityListingAPI from "src/app/api/OpportunityListingAPI";
import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";

jest.mock("src/app/api/BaseApi");

describe("OpportunityListingAPI", () => {
  const mockedRequest = jest.fn();
  const opportunityListingAPI = new OpportunityListingAPI();

  beforeAll(() => {
    opportunityListingAPI.request = mockedRequest;
  });

  afterEach(() => {
    mockedRequest.mockReset();
  });

  it("should return opportunity data for a valid ID", async () => {
    const mockResponse: OpportunityApiResponse = getValidMockResponse();

    mockedRequest.mockResolvedValue(mockResponse);

    const result = await opportunityListingAPI.getOpportunityById(12345);

    expect(mockedRequest).toHaveBeenCalledWith(
      "GET",
      opportunityListingAPI.basePath,
      opportunityListingAPI.namespace,
      "12345",
    );
    expect(result).toEqual(mockResponse);
  });

  it("should throw an error if request fails", async () => {
    const mockError = new Error("Request failed");
    mockedRequest.mockRejectedValue(mockError);

    await expect(
      opportunityListingAPI.getOpportunityById(12345),
    ).rejects.toThrow("Request failed");
  });
});

function getValidMockResponse() {
  return {
    data: {
      agency: "US-ABC",
      agency_name: "National Aeronautics and Space Administration",
      top_level_agency_name: "National Aeronautics and Space Administration",
      category: "discretionary",
      category_explanation: null,
      created_at: "2024-06-20T18:43:04.555Z",
      opportunity_assistance_listings: [
        {
          assistance_listing_number: "43.012",
          program_title: "Space Technology",
        },
      ],
      opportunity_id: 12345,
      opportunity_number: "ABC-123-XYZ-001",
      opportunity_status: "posted",
      opportunity_title: "Research into conservation techniques",
      summary: {
        additional_info_url: "grants.gov",
        additional_info_url_description: "Click me for more info",
        agency_code: "US-ABC",
        agency_contact_description:
          "For more information, reach out to Jane Smith at agency US-ABC",
        agency_email_address: "fake_email@grants.gov",
        agency_email_address_description: "Click me to email the agency",
        agency_name: "US Alphabetical Basic Corp",
        agency_phone_number: "123-456-7890",
        applicant_eligibility_description:
          "All types of domestic applicants are eligible to apply",
        applicant_types: ["state_governments"],
        archive_date: "2024-06-20",
        award_ceiling: 100000,
        award_floor: 10000,
        close_date: "2024-06-20",
        close_date_description: "Proposals are due earlier than usual.",
        estimated_total_program_funding: 10000000,
        expected_number_of_awards: 10,
        fiscal_year: 0,
        forecasted_award_date: "2024-06-20",
        forecasted_close_date: "2024-06-20",
        forecasted_close_date_description:
          "Proposals will probably be due on this date",
        forecasted_post_date: "2024-06-20",
        forecasted_project_start_date: "2024-06-20",
        funding_categories: ["recovery_act"],
        funding_category_description: "Economic Support",
        funding_instruments: ["cooperative_agreement"],
        is_cost_sharing: true,
        is_forecast: false,
        post_date: "2024-06-20",
        summary_description:
          "This opportunity aims to unravel the mysteries of the universe.",
        version_number: 1,
      },
      updated_at: "2024-06-20T18:43:04.555Z",
    },
    message: "Success",
    status_code: 200,
  };
}
