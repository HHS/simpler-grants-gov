import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedOpportunities from "src/app/[locale]/(base)/saved-opportunities/page";
import {
  BaseOpportunity,
  MinimalOpportunity,
  OpportunityApiResponse,
} from "src/types/opportunity/opportunityResponseTypes";
import { SavedOpportunitiesScope } from "src/types/opportunity/savedOpportunitiesTypes";
import { DEFAULT_SAVED_OPPORTUNITY_SCOPE } from "src/utils/opportunity/savedOpportunitiesUtils";
import { mockOpportunity } from "src/utils/testing/fixtures";
import {
  localeParams,
  mockUseTranslations,
  useTranslationsMock,
} from "src/utils/testing/intlMocks";

import { updateIsSharedWithOrganizationEnabled } from "src/components/search/SearchResultsListItem";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => mockUseTranslations,
}));

const savedOpportunities = jest.fn().mockResolvedValue([]);
const opportunity = jest.fn().mockResolvedValue({ data: [] });
const mockUseSearchParams = jest.fn().mockReturnValue(new URLSearchParams());
const clientFetchMock = jest.fn().mockResolvedValue([]);
const mockBreadcrumbs = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock(
  "src/components/shareOpportunityToOrganizations/ShareOpportunityToOrganizationsModal",
  () => ({
    ShareOpportunityToOrganizationsModal: () => null,
  }),
);

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
  fetchSavedOpportunities: (
    scope: SavedOpportunitiesScope,
    statusFilter?: string,
  ) =>
    savedOpportunities(
      DEFAULT_SAVED_OPPORTUNITY_SCOPE,
      statusFilter,
    ) as Promise<MinimalOpportunity[]>,
}));

jest.mock("src/components/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: { breadcrumbList: { title: string; path?: string }[] }) => {
    mockBreadcrumbs(props);
    return <nav data-testid="mock-breadcrumbs" />;
  },
}));

const defaultSearchParams = Promise.resolve({});

describe("Saved Opportunities page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    savedOpportunities.mockResolvedValue([]);
    updateIsSharedWithOrganizationEnabled(false);
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

  it("passes the correct breadcrumbs", async () => {
    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(screen.getByTestId("mock-breadcrumbs")).toBeInTheDocument();

    expect(mockBreadcrumbs).toHaveBeenCalledWith({
      breadcrumbList: [
        {
          title: "SavedOpportunities.breadcrumbWorkspace",
          path: "/dashboard",
        },
        {
          title: "SavedOpportunities.breadcrumbSavedOpportunities",
        },
      ],
    });
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
    savedOpportunities.mockResolvedValue([
      { opportunity_id: mockOpportunity.opportunity_id },
    ]);
    opportunity.mockResolvedValue({ data: mockOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(
      screen.getByRole("link", { name: /Test Opportunity/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("OPP-12345")).toBeInTheDocument();
  });

  it("renders status filter when there are saved opportunities", async () => {
    savedOpportunities.mockResolvedValue([
      { opportunity_id: mockOpportunity.opportunity_id },
    ]);
    opportunity.mockResolvedValue({ data: mockOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(screen.getByLabelText("statusFilter.label")).toBeInTheDocument();
    expect(screen.getByText("Any opportunity status")).toBeInTheDocument();
  });

  it("renders the share button when the feature is enabled and the opportunity is individually saved", async () => {
    updateIsSharedWithOrganizationEnabled(true);

    savedOpportunities.mockResolvedValue([
      { opportunity_id: mockOpportunity.opportunity_id },
    ]);
    opportunity.mockResolvedValue({ data: mockOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(
      await screen.findByTestId("share-opportunity-button-id"),
    ).toBeInTheDocument();
  });

  it("passes status filter to fetchSavedOpportunities when status param is provided", async () => {
    const forecastedOpportunity: BaseOpportunity = {
      ...mockOpportunity,
      opportunity_id: "forecasted-opp-id",
      opportunity_title: "Forecasted Opportunity",
      opportunity_status: "forecasted",
    };

    savedOpportunities.mockResolvedValueOnce([{ opportunity_id: 67890 }]);
    opportunity.mockResolvedValue({ data: forecastedOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: Promise.resolve({ status: "forecasted" }),
    });
    render(component);

    expect(savedOpportunities).toHaveBeenCalledWith(
      DEFAULT_SAVED_OPPORTUNITY_SCOPE,
      "forecasted",
    );
    expect(savedOpportunities).toHaveBeenCalledTimes(1);

    expect(
      screen.getByRole("link", { name: /Forecasted Opportunity/i }),
    ).toBeInTheDocument();
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

    expect(
      screen.getByRole("link", { name: /Test Opportunity/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Forecasted Opportunity/i }),
    ).toBeInTheDocument();
  });

  it("shows no matching status message when API returns no opportunities for filter", async () => {
    savedOpportunities
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ opportunity_id: 12345 }]);

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: Promise.resolve({ status: "archived" }),
    });
    render(component);

    expect(
      screen.getByText("SavedOpportunities.noMatchingStatus"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("statusFilter.label")).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    savedOpportunities.mockResolvedValue([
      { opportunity_id: mockOpportunity.opportunity_id },
    ]);
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
