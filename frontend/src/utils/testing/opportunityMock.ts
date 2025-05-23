import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

export const mockOpportunity: BaseOpportunity = {
  opportunity_id: 12345,
  opportunity_title: "Test Opportunity",
  opportunity_status: "posted",
  summary: {
    archive_date: "2023-01-01",
    close_date: "2023-02-01",
    post_date: "2023-01-15",
    agency_name: "Test Agency",
    award_ceiling: 50000,
    award_floor: 10000,
  },
  opportunityNumber: "OPP-12345",
} as BaseOpportunity;
