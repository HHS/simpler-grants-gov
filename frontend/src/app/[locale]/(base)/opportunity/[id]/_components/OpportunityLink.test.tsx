import { render, screen, within } from "@testing-library/react";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

import OpportunityLink from "./OpportunityLink";

jest.mock("src/constants/environments", () => ({
  environment: { LEGACY_HOST: "https://test.grants.gov" },
}));

const renderLink = (
  summary: Partial<BaseOpportunity["summary"]> = {},
  legacyId: number | null = 12345,
) =>
  render(
    <OpportunityLink
      opportunityData={{
        legacy_opportunity_id: legacyId as number,
        summary: { ...mockOpportunityDetail.summary, ...summary },
      }}
    />,
  );

describe("OpportunityLink", () => {
  it("renders the additional information link and the legacy link as an unbulleted list", () => {
    renderLink({
      additional_info_url: "https://example.com/info",
      additional_info_url_description: "Program website",
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "title" }),
    ).toBeInTheDocument();

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);

    const infoLink = within(items[0]).getByRole("link", {
      name: "Program website",
    });
    expect(infoLink).toHaveAttribute("href", "https://example.com/info");
    expect(infoLink).toHaveAttribute("target", "_blank");
    expect(infoLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(
      within(items[1]).getByRole("link", { name: "viewOnGrantsGov" }),
    ).toHaveAttribute(
      "href",
      "https://test.grants.gov/search-results-detail/12345",
    );
  });

  it("uses the url as the link text when there is no description", () => {
    renderLink({ additional_info_url: "https://example.com/info" });
    expect(
      screen.getByRole("link", { name: "https://example.com/info" }),
    ).toBeInTheDocument();
  });

  it("shows the fallback once, alongside the legacy link", () => {
    renderLink({
      additional_info_url: null,
      additional_info_url_description: "Description without a url",
    });

    expect(screen.getAllByText("noAdditionalInfo")).toHaveLength(1);
    expect(
      screen.queryByText("Description without a url"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "viewOnGrantsGov" }),
    ).toBeInTheDocument();
  });

  it("omits the legacy link without a legacy id", () => {
    renderLink({}, null);

    expect(screen.getByText("noAdditionalInfo")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
