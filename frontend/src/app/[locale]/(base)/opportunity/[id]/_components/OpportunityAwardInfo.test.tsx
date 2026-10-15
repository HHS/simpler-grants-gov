import { render, screen, within } from "@testing-library/react";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

import OpportunityAwardInfo from "./OpportunityAwardInfo";

const renderAwardInfo = (
  summary: Partial<BaseOpportunity["summary"]> = {},
  opportunity: Partial<BaseOpportunity> = {},
) =>
  render(
    <OpportunityAwardInfo
      opportunityData={
        {
          ...mockOpportunityDetail,
          ...opportunity,
          summary: { ...mockOpportunityDetail.summary, ...summary },
        } as BaseOpportunity
      }
    />,
  );

const detailItem = (label: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  screen.getByText(`${label}:`).closest("p");

// award min and max render their label and value as separate paragraphs in one box
const awardBox = (label: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  screen.getByText(label).parentElement as HTMLElement;

describe("OpportunityAwardInfo", () => {
  it("renders the award details", () => {
    renderAwardInfo(
      {
        estimated_total_program_funding: 1200000,
        expected_number_of_awards: 25,
        award_floor: 10000,
        award_ceiling: 100000,
        is_cost_sharing: false,
        funding_instruments: ["cooperative_agreement"],
        funding_categories: ["housing", "opportunity_zone_benefits"],
      },
      { category: "discretionary" },
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
    expect(detailItem("programFunding")).toHaveTextContent("$1,200,000");
    expect(detailItem("expectedAwards")).toHaveTextContent("25");
    expect(awardBox("awardFloor")).toHaveTextContent("$10,000");
    expect(awardBox("awardCeiling")).toHaveTextContent("$100,000");
    expect(detailItem("costSharing")).toHaveTextContent("no");
    expect(detailItem("fundingInstrument")).toHaveTextContent(
      "Cooperative agreement",
    );
    expect(detailItem("opportunityCategory")).toHaveTextContent(
      "Discretionary",
    );

    const activities = within(screen.getByRole("list")).getAllByRole(
      "listitem",
    );
    expect(activities.map((item) => item.textContent)).toEqual([
      "Housing",
      "Opportunity zone benefits",
    ]);
  });

  it("shows not available for missing award values", () => {
    renderAwardInfo({}, { category: null });

    expect(detailItem("programFunding")).toHaveTextContent("notAvailable");
    expect(detailItem("expectedAwards")).toHaveTextContent("notAvailable");
    expect(awardBox("awardFloor")).toHaveTextContent("notAvailable");
    expect(awardBox("awardCeiling")).toHaveTextContent("notAvailable");
    expect(detailItem("costSharing")).toHaveTextContent("notAvailable");
    expect(detailItem("fundingInstrument")).toHaveTextContent("notAvailable");
    expect(detailItem("opportunityCategory")).toHaveTextContent("notAvailable");
    expect(detailItem("fundingActivity")).toHaveTextContent("notAvailable");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows zero amounts instead of treating them as missing", () => {
    renderAwardInfo({ award_floor: 0, expected_number_of_awards: 0 });

    expect(awardBox("awardFloor")).toHaveTextContent("$0");
    expect(detailItem("expectedAwards")).toHaveTextContent("0");
  });

  // pending design confirmation that these can be dropped from the page
  it("keeps the opportunity number and category explanations", () => {
    renderAwardInfo(
      { funding_category_description: "Funding activity details" },
      { category_explanation: "Category details" },
    );

    expect(detailItem("opportunityNumber")).toHaveTextContent("OPP-2024-001");
    expect(detailItem("opportunityCategoryExplanation")).toHaveTextContent(
      "Category details",
    );
    expect(detailItem("categoryExplanation")).toHaveTextContent(
      "Funding activity details",
    );
  });

  it("omits the category explanations when they are not provided", () => {
    renderAwardInfo({}, { category_explanation: null });

    expect(
      screen.queryByText("opportunityCategoryExplanation:"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("categoryExplanation:")).not.toBeInTheDocument();
  });
});
