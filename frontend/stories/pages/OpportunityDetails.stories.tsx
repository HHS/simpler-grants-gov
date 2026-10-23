import OpportunityAwardInfo from "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityAwardInfo";
import OpportunityContact from "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityContact";
import OpportunityDescription from "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityDescription";
import OpportunityDocuments from "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityDocuments";
import OpportunityHistory from "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityHistory";
import OpportunityImportantDates from "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityImportantDates";
import OpportunityLink from "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityLink";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { GridContainer } from "@trussworks/react-uswds";

// The opportunity page is an async server component, so Storybook renders a copy
// of its body layout (no header). Keep it in sync with opportunity/[id]/page.tsx.
const OpportunityDetailsLayout = ({
  opportunity,
}: {
  opportunity: OpportunityDetail;
}) => (
  <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6">
    <div className="grid-row grid-gap" id="opportunity-detail-content">
      <div className="desktop:grid-col-4 grid-col-12 desktop:order-last margin-bottom-4 desktop:margin-bottom-0">
        <OpportunityImportantDates detail={opportunity} />
        <OpportunityAwardInfo opportunityData={opportunity} />
        <OpportunityHistory
          summary={opportunity.summary}
          status={opportunity.opportunity_status}
          legacyOpportunityId={opportunity.legacy_opportunity_id}
        />
      </div>

      <div className="desktop:grid-col-8 grid-col-12">
        <OpportunityDescription
          summary={opportunity.summary}
          attachments={opportunity.attachments}
        />
        <OpportunityDocuments
          documents={opportunity.attachments}
          opportunityId={opportunity.opportunity_id}
        />
        <OpportunityContact summary={opportunity.summary} />
        <OpportunityLink opportunityData={opportunity} />
      </div>
    </div>
  </GridContainer>
);

const meta = {
  title: "Pages/Opportunity Details",
  component: OpportunityDetailsLayout,
  parameters: {
    layout: "fullscreen",
  },
};
export default meta;

const baseOpportunity: OpportunityDetail = {
  opportunity_id: "6a483cd8-9169-418a-8dfb-60fa6e6f51e5",
  legacy_opportunity_id: 350000,
  opportunity_status: "posted",
  opportunity_title: "Community Housing Development Grants",
  opportunity_number: "HUD-2026-001",
  agency_code: "HUD",
  agency_name: "Department of Housing and Urban Development",
  top_level_agency_name: "Department of Housing and Urban Development",
  category: "discretionary",
  category_explanation: "Funds are awarded at the agency's discretion.",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  is_draft: false,
  is_simpler_grants_opportunity: false,
  submitted_application_count: 0,
  opportunity_assistance_listings: [],
  competitions: null,
  attachments: [
    {
      file_name: "NOFO.pdf",
      file_description: "Notice of funding opportunity",
      download_path: "https://example.com/nofo.pdf",
      updated_at: "2026-09-01T00:00:00Z",
    },
    {
      file_name: "BudgetTemplate.xlsx",
      file_description: "Budget template",
      download_path: "https://example.com/budget.xlsx",
      updated_at: "2026-09-02T00:00:00Z",
    },
  ],
  summary: {
    version_number: 3,
    is_forecast: false,
    summary_description:
      "<p>The purpose of this Notice of Funding Opportunity is to support housing development in rural communities.</p>",
    applicant_types: [
      "state_governments",
      "nonprofits_non_higher_education_with_501c3",
    ],
    applicant_eligibility_description:
      "<p>Applicants must be registered in SAM.gov.</p>",
    post_date: "2026-08-01",
    close_date: "2026-12-15",
    close_date_description: "Applications are due by 5:00 PM Eastern.",
    archive_date: "2027-01-15",
    forecasted_post_date: null,
    forecasted_close_date: null,
    forecasted_close_date_description: null,
    forecasted_award_date: null,
    forecasted_project_start_date: null,
    fiscal_year: null,
    estimated_total_program_funding: 1200000,
    expected_number_of_awards: 25,
    award_floor: 25000,
    award_ceiling: 100000,
    is_cost_sharing: false,
    funding_instruments: ["cooperative_agreement"],
    funding_categories: ["housing", "opportunity_zone_benefits"],
    funding_category_description: "Rural housing development.",
    agency_code: "HUD",
    agency_name: "Department of Housing and Urban Development",
    agency_contact_description: "<p>Office of Rural Housing</p>",
    agency_email_address: "housing@example.gov",
    agency_email_address_description: "Questions about this opportunity",
    agency_phone_number: null,
    additional_info_url: "https://example.gov/housing-grants",
    additional_info_url_description: "Housing grants program page",
    updated_at: "2026-09-01T00:00:00Z",
  },
};

const withSummary = (
  summary: Partial<OpportunityDetail["summary"]>,
  overrides: Partial<OpportunityDetail> = {},
): OpportunityDetail => ({
  ...baseOpportunity,
  ...overrides,
  summary: { ...baseOpportunity.summary, ...summary },
});

export const Posted = {
  args: { opportunity: baseOpportunity },
};

export const PostedWithoutCloseDate = {
  args: {
    opportunity: withSummary({
      close_date: null,
      close_date_description:
        "Applications are accepted on a rolling basis until funds run out.",
    }),
  },
};

export const Forecasted = {
  args: {
    opportunity: withSummary(
      {
        is_forecast: true,
        post_date: "2026-11-01",
        close_date: null,
        close_date_description: null,
        archive_date: null,
        forecasted_post_date: "2026-11-01",
        forecasted_close_date: "2027-01-15",
        forecasted_award_date: "2027-05-01",
        forecasted_project_start_date: "2027-07-01",
        fiscal_year: 2027,
      },
      { opportunity_status: "forecasted", attachments: [] },
    ),
  },
};

export const ForecastedWithoutPostDate = {
  args: {
    opportunity: withSummary(
      {
        is_forecast: true,
        post_date: null,
        close_date: null,
        close_date_description: null,
        forecasted_post_date: null,
        forecasted_close_date: null,
        forecasted_award_date: null,
        forecasted_project_start_date: null,
        fiscal_year: null,
      },
      { opportunity_status: "forecasted", attachments: [] },
    ),
  },
};

export const Closed = {
  args: {
    opportunity: withSummary(
      { close_date: "2026-09-30" },
      { opportunity_status: "closed" },
    ),
  },
};

export const ClosedWithoutCloseDate = {
  args: {
    opportunity: withSummary(
      {
        close_date: null,
        close_date_description: "This opportunity closed when funds ran out.",
      },
      { opportunity_status: "closed" },
    ),
  },
};

export const Archived = {
  args: {
    opportunity: withSummary(
      { close_date: "2026-03-01", archive_date: "2026-05-01" },
      { opportunity_status: "archived" },
    ),
  },
};

export const EmptyValues = {
  args: {
    opportunity: withSummary(
      {
        summary_description: null,
        applicant_types: [],
        applicant_eligibility_description: null,
        close_date: null,
        close_date_description: null,
        archive_date: null,
        estimated_total_program_funding: null,
        expected_number_of_awards: null,
        award_floor: null,
        award_ceiling: null,
        is_cost_sharing: null,
        funding_instruments: [],
        funding_categories: [],
        funding_category_description: null,
        agency_contact_description: null,
        agency_email_address: null,
        agency_email_address_description: null,
        additional_info_url: null,
        additional_info_url_description: null,
        version_number: null,
      },
      { attachments: [], category_explanation: null },
    ),
  },
};
