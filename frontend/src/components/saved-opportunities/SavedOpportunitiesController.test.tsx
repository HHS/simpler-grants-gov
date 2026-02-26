import { act, render, screen, within } from "@testing-library/react";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { UserOrganization } from "src/types/userTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import type { ReactNode } from "react";

import { SavedOpportunitiesController } from "src/components/saved-opportunities/SavedOpportunitiesController";

function FocusTrapMock({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

jest.mock("focus-trap-react", () => ({
  __esModule: true,
  default: FocusTrapMock,
  FocusTrap: FocusTrapMock,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const clientFetchMock = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) =>
      Promise.resolve(clientFetchMock(...args)) as unknown,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({
    user: { token: "faketoken" },
    refreshIfExpired: jest.fn().mockResolvedValue(false),
    refreshUser: jest.fn(),
    refreshIfExpiring: jest.fn().mockResolvedValue(false),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockOpportunities: BaseOpportunity[] = [
  {
    opportunity_id: "opp-1",
    legacy_opportunity_id: 1,
    opportunity_status: "posted",
    opportunity_title: "Opportunity One",
    opportunity_number: "OPP-1",
    summary: {
      award_ceiling: 1000,
      award_floor: 100,
      close_date: "2026-01-01",
      post_date: "2025-12-01",
      is_forecast: false,
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
      version_number: null,
    },
    saved_to_organizations: [{ organization_id: "org-1" }],
    agency_code: null,
    agency_name: null,
    category: null,
    category_explanation: null,
    created_at: "",
    opportunity_assistance_listings: [],
    top_level_agency_name: null,
    updated_at: "",
  },
  {
    opportunity_id: "opp-2",
    legacy_opportunity_id: 2,
    opportunity_status: "posted",
    opportunity_title: "Opportunity Two",
    opportunity_number: "OPP-2",
    summary: {
      award_ceiling: 2000,
      award_floor: 200,
      close_date: "2026-02-01",
      post_date: "2025-12-15",
      is_forecast: false,
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
      version_number: null,
    },
    saved_to_organizations: [],
    agency_code: null,
    agency_name: null,
    category: null,
    category_explanation: null,
    created_at: "",
    opportunity_assistance_listings: [],
    top_level_agency_name: null,
    updated_at: "",
  },
];

const mockOrganizations: UserOrganization[] = [
  {
    organization_id: "org-1",
    is_organization_owner: true,
    sam_gov_entity: {
      legal_business_name: "First Organization",
      uei: "UEI000001",
      expiration_date: "2026-01-01",
      ebiz_poc_email: "poc@first.org",
      ebiz_poc_first_name: "Alice",
      ebiz_poc_last_name: "Smith",
    },
  },
  {
    organization_id: "org-2",
    is_organization_owner: false,
    sam_gov_entity: {
      legal_business_name: "Second Organization",
      uei: "UEI000002",
      expiration_date: "2026-01-01",
      ebiz_poc_email: "poc@second.org",
      ebiz_poc_first_name: "Bob",
      ebiz_poc_last_name: "Jones",
    },
  },
];

describe("SavedOpportunitiesController", () => {
  beforeEach(() => {
    clientFetchMock.mockResolvedValue([]);
  });

  afterEach(() => {
    clientFetchMock.mockReset();
  });

  it("renders a Share button on every saved opportunity item", async () => {
    clientFetchMock.mockResolvedValue(mockOrganizations);

    render(<SavedOpportunitiesController opportunities={mockOpportunities} />);

    const shareButtons = await screen.findAllByRole("button", {
      name: "callToAction.shareWithOrganization",
    });

    expect(shareButtons).toHaveLength(2);
  });

  it("opens the single modal when clicking a Share button", async () => {
    clientFetchMock.mockResolvedValue(mockOrganizations);

    render(<SavedOpportunitiesController opportunities={mockOpportunities} />);

    expect(screen.queryByRole("dialog")).toHaveClass("is-hidden");

    const shareButtons = await screen.findAllByRole("button", {
      name: "callToAction.shareWithOrganization",
    });

    act(() => {
      shareButtons[0]?.click();
    });

    expect(screen.getByRole("dialog")).not.toHaveClass("is-hidden");
  });

  it("updates the modal opportunity title based on which card is clicked", async () => {
    clientFetchMock.mockResolvedValue(mockOrganizations);

    render(<SavedOpportunitiesController opportunities={mockOpportunities} />);

    const shareButtons = await screen.findAllByRole("button", {
      name: "callToAction.shareWithOrganization",
    });

    act(() => {
      shareButtons[1]?.click();
    });

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText((content) =>
        content.includes("Opportunity Two"),
      ),
    ).toBeInTheDocument();
  });

  it("renders disabled checkboxes once organizations are loaded", async () => {
    clientFetchMock.mockResolvedValue(mockOrganizations);

    render(<SavedOpportunitiesController opportunities={mockOpportunities} />);

    const shareButtons = await screen.findAllByRole("button", {
      name: "callToAction.shareWithOrganization",
    });

    act(() => {
      shareButtons[0]?.click();
    });

    await screen.findByText("First Organization");

    screen.getAllByRole("checkbox").forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });
  });
});
