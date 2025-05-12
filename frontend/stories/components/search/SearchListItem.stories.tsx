import { Meta } from "@storybook/react";

import Item from "src/components/search/SearchResultsListItem";

const meta: Meta<typeof Item> = {
  title: "Components/Search/SearchListItem",
  component: Item,
  args: {
    saved: true,
    opportunity: {
      opportunity_id: 1,
      opportunity_title: "Opportunity Title",
      agency_code: "123",
      agency_name: "Agency Name",
      category: "category",
      categoryExplanation: "Category Explanation",
      created_at: "2023-01-01",
      opportunity_assistance_listings: [
        {
          assistance_listing_number: "123",
          program_title: "Program Title",
        },
      ],
      opportunityNumber: "123",
      opportunity_status: "posted",
      top_level_agency_name: "Top Level Agency Name",
      updated_at: "2023",
      summary: {
        archive_date: "2022-01-01",
        agency_code: "123",
        additional_info_url: null,
        additional_info_url_description: null,
        agency_contact_description: null,
        agency_email_address: null,
        agency_email_address_description: null,
        agency_name: null,
        agency_phone_number: null,
        applicant_eligibility_description: null,
        applicant_types: null,
        awardCeiling: 200000000,
        awardFloor: 1,
        close_date: "2022-01-01",
        close_date_description: "soon",
        estimatedTotalProgramFunding: null,
        expectedNumberOfAwards: null,
        fiscal_year: 2023,
        forecasted_award_date: null,
        forecasted_close_date: "2023-01-01",
        forecasted_close_date_description: null,
        forecasted_post_date: "2023-01-01",
        forecasted_project_start_date: null,
        fundingCategories: null,
        fundingCategoryDescription: null,
        fundingInstruments: null,
        isCostSharing: null,
        is_forecast: true,
        post_date: "2023-01-01",
        summary_description: null,
        version_number: null,
      },
    },
  },
};
export default meta;

export const Default = {};
