import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedOpportunities from "src/app/[locale]/(base)/saved-opportunities/page";
import {
  BaseOpportunity,
  MinimalOpportunity,
  OpportunityApiResponse,
} from "src/types/opportunity/opportunityResponseTypes";
import { SavedOpportunitiesScope } from "src/types/opportunity/savedOpportunitiesTypes";
import {
  DEFAULT_SAVED_OPPORTUNITY_SCOPE,
  INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE,
} from "src/utils/opportunity/savedOpportunitiesUtils";
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

const savedOpportunitiesMock = jest.fn();
const opportunityMock = jest.fn().mockResolvedValue({ data: [] });
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
  getOpportunityDetails: () =>
    opportunityMock() as Promise<OpportunityApiResponse>,
}));

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  fetchSavedOpportunities: (
    scope: SavedOpportunitiesScope,
    statusFilter?: string,
  ) =>
    savedOpportunitiesMock(
      scope,
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

function mockSavedOpportunitiesByScope({
  combinedSavedOpportunities = [],
  individuallySavedOpportunities = [],
}: {
  combinedSavedOpportunities?: MinimalOpportunity[];
  individuallySavedOpportunities?: MinimalOpportunity[];
}) {
  savedOpportunitiesMock.mockImplementation(
    (scope: SavedOpportunitiesScope, statusFilter?: string) => {
      if (scope === INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE) {
        return Promise.resolve(individuallySavedOpportunities);
      }

      if (
        scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE ||
        statusFilter !== undefined
      ) {
        return Promise.resolve(combinedSavedOpportunities);
      }

      return Promise.resolve(combinedSavedOpportunities);
    },
  );
}

describe("Saved Opportunities page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateIsSharedWithOrganizationEnabled(false);

    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [],
      individuallySavedOpportunities: [],
    });
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
    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
    });
    opportunityMock.mockResolvedValue({ data: mockOpportunity });

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
    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [],
    });
    opportunityMock.mockResolvedValue({ data: mockOpportunity });

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

    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
    });
    opportunityMock.mockResolvedValue({ data: mockOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(
      await screen.findByTestId("share-opportunity-button-id"),
    ).toBeInTheDocument();
  });

  it("preserves the Individual tag when an individually saved opportunity is also shared with organizations", async () => {
    updateIsSharedWithOrganizationEnabled(true);

    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
          saved_to_organizations: [
            {
              organization_id: "org-2",
              organization_name: "Bravo Org",
            },
            {
              organization_id: "org-1",
              organization_name: "Alpha Org",
            },
          ],
        } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
    });

    opportunityMock.mockResolvedValue({ data: mockOpportunity });

    clientFetchMock.mockResolvedValue([
      {
        organization_id: "org-1",
        sam_gov_entity: { legal_business_name: "Alpha Org" },
      },
      {
        organization_id: "org-2",
        sam_gov_entity: { legal_business_name: "Bravo Org" },
      },
    ]);

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(await screen.findByText("Individual")).toBeInTheDocument();
    expect(screen.getByText("Alpha Org")).toBeInTheDocument();
    expect(screen.getByText("Bravo Org")).toBeInTheDocument();
  });

  it("passes status filter to fetchSavedOpportunities when status param is provided", async () => {
    const forecastedOpportunity: BaseOpportunity = {
      ...mockOpportunity,
      opportunity_id: "forecasted-opp-id",
      opportunity_title: "Forecasted Opportunity",
      opportunity_status: "forecasted",
    };

    savedOpportunitiesMock.mockImplementation(
      (scope: SavedOpportunitiesScope, statusFilter?: string) => {
        if (scope === INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE) {
          return Promise.resolve([]);
        }

        if (
          scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
          statusFilter === "forecasted"
        ) {
          return Promise.resolve([
            { opportunity_id: forecastedOpportunity.opportunity_id },
          ]);
        }

        return Promise.resolve([]);
      },
    );

    opportunityMock.mockResolvedValue({ data: forecastedOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: Promise.resolve({ status: "forecasted" }),
    });
    render(component);

    expect(savedOpportunitiesMock).toHaveBeenCalledWith(
      DEFAULT_SAVED_OPPORTUNITY_SCOPE,
      "forecasted",
    );

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

    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
        {
          opportunity_id: forecastedOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
    });

    opportunityMock
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
    savedOpportunitiesMock.mockImplementation(
      (scope: SavedOpportunitiesScope, statusFilter?: string) => {
        if (scope === INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE) {
          return Promise.resolve([]);
        }

        if (
          scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
          statusFilter === "archived"
        ) {
          return Promise.resolve([]);
        }

        if (scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE) {
          return Promise.resolve([
            { opportunity_id: mockOpportunity.opportunity_id },
          ]);
        }

        return Promise.resolve([]);
      },
    );

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
    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        { opportunity_id: mockOpportunity.opportunity_id } as MinimalOpportunity,
      ],
    });
    opportunityMock.mockResolvedValue({ data: mockOpportunity });

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
