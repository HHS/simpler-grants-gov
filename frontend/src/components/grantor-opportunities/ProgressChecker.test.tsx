import { render, screen } from "@testing-library/react";
import {
  BaseOpportunity,
  OpportunityAssistanceListing,
  Summary,
} from "src/types/opportunity/opportunityResponseTypes";

import { getProgess, ProgressChecker, progressType } from "./ProgressChecker";

// These objects define the required fields
const summaryRequiredFields = {
  funding_instruments: true,
  funding_categories: true,
  post_date: true,
  applicant_types: true,
};
const baseOpportunityRequiredFields = {
  agency_code: true,
  category: true,
  opportunity_assistance_listings: true,
  opportunity_number: true,
  opportunity_title: true,
};
const opportunityWithSummaryRequiredFields = {
  ...baseOpportunityRequiredFields,
  summary: summaryRequiredFields,
};

// These are the data objects for testing
const testALN: OpportunityAssistanceListing = {
  assistance_listing_number: "30.CLY",
  program_title: "Test ALN",
};
const summaryData: Summary = {
  close_date: null,
  is_forecast: false,
  post_date: null,
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
  summary_description: null,
  updated_at: "",
  version_number: null,
};

// A. Test the function on a single object
describe("checkProgress", () => {
  const opportunityData: Partial<BaseOpportunity> = {};
  it("is a function", () => {
    expect(typeof getProgess).toBe("function");
  });

  it("returns 'not started' if all fields do not have values", () => {
    const status = getProgess(baseOpportunityRequiredFields, opportunityData);
    expect(status).toEqual(progressType.notStarted);
  });

  it("returns 'in progress' if some data has values", () => {
    opportunityData.category_explanation = "Some explanation here";
    opportunityData.top_level_agency_name = "Top Level Agency";
    const status = getProgess(baseOpportunityRequiredFields, opportunityData);
    expect(status).toEqual(progressType.inProgress);
  });

  it("returns 'in progress' if some required fields have values", () => {
    opportunityData.agency_code = "ABCD";
    opportunityData.category = "Discretionary";
    const status = getProgess(baseOpportunityRequiredFields, opportunityData);
    expect(status).toEqual(progressType.inProgress);
  });

  it("returns 'complete' if all required fields have values", () => {
    opportunityData.opportunity_assistance_listings = [testALN];
    opportunityData.opportunity_number = "DAO-TEST-001";
    opportunityData.opportunity_title = "Dao's Test 001";
    const status = getProgess(baseOpportunityRequiredFields, opportunityData);
    expect(status).toEqual(progressType.complete);
  });
});

// Test the function with nested objects
describe("checkProgress with nested objects", () => {
  const opportunityWithSummaryData: Partial<BaseOpportunity> = {};
  it("nested objects: returns 'not started' if all required fields do not have values", () => {
    const status = getProgess(
      opportunityWithSummaryRequiredFields,
      opportunityWithSummaryData,
    );
    expect(status).toEqual(progressType.notStarted);
  });

  it("nested objects: returns 'in progress' if some fields have values", () => {
    opportunityWithSummaryData.summary = summaryData;
    summaryData.agency_email_address = "someone@somewhere.com";
    const status = getProgess(
      opportunityWithSummaryRequiredFields,
      opportunityWithSummaryData,
    );
    expect(status).toEqual(progressType.inProgress);
  });

  it("nested objects: returns 'in progress' if some required fields have values", () => {
    summaryData.funding_instruments = ["Grant"];
    summaryData.funding_categories = ["Other"];
    const status = getProgess(
      opportunityWithSummaryRequiredFields,
      opportunityWithSummaryData,
    );
    expect(status).toEqual(progressType.inProgress);
  });

  it("nested objects: returns 'complete' if all required fields have values", () => {
    summaryData.post_date = "2026-06-23";
    summaryData.applicant_types = ["Small businesses", "Other"];
    opportunityWithSummaryData.agency_code = "ABCD";
    opportunityWithSummaryData.category = "Discretionary";
    opportunityWithSummaryData.opportunity_assistance_listings = [testALN];
    opportunityWithSummaryData.opportunity_number = "DAO-TEST-001";
    opportunityWithSummaryData.opportunity_title = "Dao's Test 001";
    const status = getProgess(
      opportunityWithSummaryRequiredFields,
      opportunityWithSummaryData,
    );
    expect(status).toEqual(progressType.complete);
  });
});

// Test the component's rendering of the HTML statuses
describe("ProgressChecker", () => {
  const opportunityData: Partial<BaseOpportunity> = {};

  it("is a function", () => {
    expect(typeof ProgressChecker).toBe("function");
  });

  it("is defined", () => {
    // This is a basic test to ensure the component interface is correct
    const component = ProgressChecker;
    expect(component).toBeDefined();
  });

  it("returns 'not started' if all fields do not have values", () => {
    render(
      <ProgressChecker
        requiredFields={baseOpportunityRequiredFields}
        dataToCheck={opportunityData}
      />,
    );
    expect(screen.getByText("notStarted")).toBeVisible();
  });

  it("returns 'in progress' if some required fields have values", () => {
    opportunityData.agency_code = "ABCD";
    opportunityData.category = "Discretionary";
    render(
      <ProgressChecker
        requiredFields={baseOpportunityRequiredFields}
        dataToCheck={opportunityData}
      />,
    );
    expect(screen.getByText("inProgress")).toBeVisible();
  });

  it("returns 'complete' if all required fields have values", () => {
    opportunityData.opportunity_assistance_listings = [testALN];
    opportunityData.opportunity_number = "DAO-TEST-001";
    opportunityData.opportunity_title = "Dao's Test 001";
    render(
      <ProgressChecker
        requiredFields={baseOpportunityRequiredFields}
        dataToCheck={opportunityData}
      />,
    );
    expect(screen.getByText("complete")).toBeVisible();
  });
});
