import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createAwardRecommendationAction } from "src/app/[locale]/(base)/award-recommendation/select-opportunity/actions";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";

import { SelectFundingOpportunityContent } from "./SelectFundingOpportunityContent";

const pushMock = jest.fn();

jest.mock(
  "src/app/[locale]/(base)/award-recommendation/select-opportunity/actions",
  () => ({
    createAwardRecommendationAction: jest.fn(),
  }),
);

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      whichFundingOpportunity: "Which Funding Opportunity?",
      cancelButtonText: "Cancel",
      startButtonText: "Start",
      "columns.fundingOpportunityNumber": "Funding opportunity number",
      "columns.fundingOpportunityName": "Funding opportunity name",
      "columns.submittedApplications": "Submitted applications",
      "columns.action": "Action",
    };

    return translations[key] ?? key;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("SelectFundingOpportunityContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFundingOpportunity = (
    overrides: Partial<BaseOpportunity> = {},
  ): BaseOpportunity =>
    ({
      opportunity_id: "opp-1",
      opportunity_number: "OPP-001",
      opportunity_title: "Test Opportunity",
      submitted_application_count: 3,

      agency_code: null,
      agency_name: null,
      category: null,
      category_explanation: null,
      created_at: "2026-06-23T00:00:00Z",
      updated_at: "2026-06-23T00:00:00Z",
      opportunity_assistance_listings: [],
      top_level_agency_name: null,
      is_draft: false,
      is_simpler_grants_opportunity: true,
      saved_to_organizations: [],
      summary: {} as BaseOpportunity["summary"],

      ...overrides,
    }) as BaseOpportunity;

  const mockFundingOpportunities: BaseOpportunity[] = [
    mockFundingOpportunity(),
  ];

  it("renders the funding opportunity heading", () => {
    render(
      <SelectFundingOpportunityContent
        fundingOpportunities={mockFundingOpportunities}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Which Funding Opportunity?",
        level: 2,
      }),
    ).toBeInTheDocument();
  });

  it("renders the funding opportunities table", () => {
    render(
      <SelectFundingOpportunityContent
        fundingOpportunities={mockFundingOpportunities}
      />,
    );

    expect(screen.getByText("OPP-001")).toBeInTheDocument();
    expect(screen.getByText("Test Opportunity")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the cancel button", () => {
    render(
      <SelectFundingOpportunityContent
        fundingOpportunities={mockFundingOpportunities}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    ).toBeInTheDocument();
  });

  it("navigates to home when cancel is clicked", async () => {
    const user = userEvent.setup();

    render(
      <SelectFundingOpportunityContent
        fundingOpportunities={mockFundingOpportunities}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("creates an award recommendation and navigates to the detail page", async () => {
    const user = userEvent.setup();

    jest.mocked(createAwardRecommendationAction).mockResolvedValue({
      awardRecommendationId: "award-rec-1",
    });

    render(
      <SelectFundingOpportunityContent
        fundingOpportunities={mockFundingOpportunities}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Start/i }));

    expect(createAwardRecommendationAction).toHaveBeenCalledWith("opp-1");
    expect(pushMock).toHaveBeenCalledWith(
      "/award-recommendation/award-rec-1/edit",
    );
  });
});
