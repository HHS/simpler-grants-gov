import { axe } from "jest-axe";
import SavedOpportunities from "src/app/[locale]/(base)/saved-opportunities/page";
import {
  BaseOpportunity,
  MinimalOpportunity,
  OpportunityApiResponse,
} from "src/types/opportunity/opportunityResponseTypes";
import { mockOpportunity } from "src/utils/testing/fixtures";
import {
  localeParams,
  mockUseTranslations,
  useTranslationsMock,
} from "src/utils/testing/intlMocks";
import { render, screen, waitFor } from "tests/react-utils";

import { ReactNode } from "react";

jest.mock("next-intl/server", () => ({
  getTranslations: () => mockUseTranslations,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children, // this is a dumb workaround for a global wrapper we're using
}));

const savedOpportunities = jest.fn().mockResolvedValue([]);
const opportunity = jest.fn().mockResolvedValue({ data: [] });
const mockUseSearchParams = jest.fn().mockReturnValue(new URLSearchParams());

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams() as unknown,
  usePathname: () => "/saved-opportunities",
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("src/services/fetch/fetchers/opportunityFetcher", () => ({
  getOpportunityDetails: () => opportunity() as Promise<OpportunityApiResponse>,
}));

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: (statusFilter?: string) =>
    savedOpportunities(statusFilter) as Promise<MinimalOpportunity[]>,
}));

const defaultSearchParams = Promise.resolve({});

describe("Saved Opportunities page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedOpportunities.mockResolvedValue([]);
  });

  it("renders intro text for user with no saved opportunities", async () => {
    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    const content = await screen.findByText("noSavedCTAParagraphOne");

    await waitFor(() => expect(content).toBeInTheDocument());
  });

  it("does not render status filter when there are no saved opportunities", async () => {
    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(
      screen.queryByLabelText("statusFilter.label"),
    ).not.toBeInTheDocument();
  });

  it("renders a list of saved opportunities", async () => {
    savedOpportunities.mockResolvedValue([{ opportunity_id: 12345 }]);
    opportunity.mockResolvedValue({ data: mockOpportunity });
    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(screen.getByText("Test Opportunity")).toBeInTheDocument();
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Test Opportunity",
      }),
    ).toBeInTheDocument();
  });

  it("renders status filter when there are saved opportunities", async () => {
    savedOpportunities.mockResolvedValue([{ opportunity_id: 12345 }]);
    opportunity.mockResolvedValue({ data: mockOpportunity });
    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(screen.getByLabelText("statusFilter.label")).toBeInTheDocument();
    expect(screen.getByText("Any opportunity status")).toBeInTheDocument();
  });

  it("passes status filter to fetchSavedOpportunities when status param is provided", async () => {
    const forecastedOpportunity: BaseOpportunity = {
      ...mockOpportunity,
      opportunity_id: "forecasted-opp-id",
      opportunity_title: "Forecasted Opportunity",
      opportunity_status: "forecasted",
    };

    // With optimized logic: first call is filtered, returns results so no second call needed
    savedOpportunities.mockResolvedValueOnce([{ opportunity_id: 67890 }]);
    opportunity.mockResolvedValue({ data: forecastedOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: Promise.resolve({ status: "forecasted" }),
    });
    render(component);

    // Verify fetchSavedOpportunities was called with the status filter
    expect(savedOpportunities).toHaveBeenCalledWith("forecasted");
    // Should only be called once since filtered results were found
    expect(savedOpportunities).toHaveBeenCalledTimes(1);
    // Should show the forecasted opportunity
    expect(screen.getByText("Forecasted Opportunity")).toBeInTheDocument();
  });

  it("shows all opportunities when no status filter is applied", async () => {
    const forecastedOpportunity: BaseOpportunity = {
      ...mockOpportunity,
      opportunity_id: "forecasted-opp-id",
      opportunity_title: "Forecasted Opportunity",
      opportunity_status: "forecasted",
    };

    savedOpportunities.mockResolvedValue([
      { opportunity_id: 12345 },
      { opportunity_id: 67890 },
    ]);
    opportunity
      .mockResolvedValueOnce({ data: mockOpportunity })
      .mockResolvedValueOnce({ data: forecastedOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    // Should show both opportunities
    expect(screen.getByText("Test Opportunity")).toBeInTheDocument();
    expect(screen.getByText("Forecasted Opportunity")).toBeInTheDocument();
  });

  it("shows no matching status message when API returns no opportunities for filter", async () => {
    // With optimized logic: first call is filtered (returns empty),
    // second call is unfiltered to check if user has any saved opportunities
    savedOpportunities
      .mockResolvedValueOnce([]) // filtered call returns empty
      .mockResolvedValueOnce([{ opportunity_id: 12345 }]); // unfiltered call returns opportunities

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: Promise.resolve({ status: "archived" }),
    });
    render(component);

    // Should show the no matching status message
    expect(
      screen.getByText("SavedOpportunities.noMatchingStatus"),
    ).toBeInTheDocument();
    // Should still show the filter
    expect(screen.getByLabelText("statusFilter.label")).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    savedOpportunities.mockResolvedValue([{ opportunity_id: 12345 }]);
    opportunity.mockResolvedValue({ data: mockOpportunity });
    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
