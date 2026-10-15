import { render, screen, within } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

import OpportunityEligibility, {
  applicantTypesToGroups,
} from "./OpportunityEligibility";

const renderEligibility = (
  summary: Partial<OpportunityDetail["summary"]> = {},
  status: OpportunityDetail["opportunity_status"] = "posted",
) =>
  render(
    <OpportunityEligibility
      opportunityData={{
        opportunity_status: status,
        summary: { ...mockOpportunityDetail.summary, ...summary },
      }}
    />,
  );

describe("OpportunityEligibility", () => {
  it("renders the eligibility and additional information headings", () => {
    renderEligibility();

    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "additionalInfo" }),
    ).toHaveAttribute("id", "opportunity-additional-eligibility-info");
    expect(screen.queryByText("eligibleApplicants")).not.toBeInTheDocument();
  });

  it("renders applicant types as a list of groups, each with a nested list", () => {
    renderEligibility({
      applicant_types: [
        "nonprofits_non_higher_education_with_501c3",
        "state_governments",
        "public_and_indian_housing_authorities",
      ],
    });

    const groupList = screen.getAllByRole("list")[0];
    const groups = within(groupList)
      .getAllByRole("listitem")
      // eslint-disable-next-line testing-library/no-node-access
      .filter((item) => item.parentElement === groupList);

    // groups follow the design order rather than the API order
    expect(groups.map((group) => group.firstChild?.textContent)).toEqual([
      "groups.government:",
      "groups.nativeAmerican:",
      "groups.nonprofit:",
    ]);
    expect(within(groups[0]).getByRole("list")).toHaveTextContent(
      "State governments",
    );
    expect(within(groups[1]).getByRole("list")).toHaveTextContent(
      "Public and Indian housing authorities",
    );
  });

  it("shows not available when there are no applicant types", () => {
    renderEligibility({ applicant_types: [] });

    expect(screen.getByText("notAvailable")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the sanitized additional eligibility information", () => {
    renderEligibility({
      applicant_eligibility_description:
        "<p>Extra details</p><script>alert('x')</script>",
    });

    expect(screen.getByText("Extra details")).toBeInTheDocument();
    expect(screen.queryByText("alert('x')")).not.toBeInTheDocument();
    expect(screen.queryByText("noAdditionalInfo")).not.toBeInTheDocument();
  });

  it("shows a fallback when there is no additional eligibility information", () => {
    renderEligibility({ applicant_eligibility_description: null });
    expect(screen.getByText("noAdditionalInfo")).toBeInTheDocument();
  });

  it("shows the close date description when there is no close date", () => {
    renderEligibility({
      close_date: null,
      close_date_description: "Rolling deadline",
    });

    // the label and description are separate text nodes in one paragraph
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent === "closeDateDescription: Rolling deadline",
      ),
    ).toBeInTheDocument();
  });

  it("leaves the close date description with the close date when there is one", () => {
    renderEligibility({
      close_date: "2026-08-17",
      close_date_description: "Rolling deadline",
    });

    expect(screen.queryByText("Rolling deadline")).not.toBeInTheDocument();
  });

  it("never shows the close date description for forecasts", () => {
    renderEligibility(
      { close_date: null, close_date_description: "Rolling deadline" },
      "forecasted",
    );

    expect(screen.queryByText("Rolling deadline")).not.toBeInTheDocument();
  });
});

describe("applicantTypesToGroups", () => {
  it("groups applicant types in the page's group order and skips unknown types", () => {
    expect(
      applicantTypesToGroups([
        "individuals",
        "small_businesses",
        "federally_recognized_native_american_tribal_governments",
        "independent_school_districts",
        "unknown_type",
      ]),
    ).toEqual([
      { key: "forProfit", labels: ["Small businesses"] },
      { key: "education", labels: ["Independent school districts"] },
      {
        key: "nativeAmerican",
        labels: ["Federally recognized Native American tribal governments"],
      },
      { key: "miscellaneous", labels: ["Individuals"] },
    ]);
  });
});
