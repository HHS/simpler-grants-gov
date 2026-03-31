import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedOpportunities from "src/app/[locale]/(base)/workspace/saved-opportunities/page";
import { Organization } from "src/types/applicationResponseTypes";
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

const getSessionMock = jest.fn<
  Promise<{ token: string; user_id: string; email: string } | null>,
  []
>();

const getUserOrganizationsMock = jest.fn<
  Promise<Organization[]>,
  [string, string]
>();
jest.mock("src/services/auth/session", () => ({
  getSession: () => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getUserOrganizations: (token: string, userId: string) =>
    getUserOrganizationsMock(token, userId),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => mockUseTranslations,
}));

const savedOpportunitiesMock = jest.fn();
const opportunityMock = jest.fn().mockResolvedValue({ data: [] });
const mockUseSearchParams = jest.fn().mockReturnValue(new URLSearchParams());
const mockBreadcrumbs = jest.fn();

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
    organizationIdsFilter?: string[] | null,
  ) =>
    savedOpportunitiesMock(
      scope,
      statusFilter,
      organizationIdsFilter,
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
    (
      scope: SavedOpportunitiesScope,
      statusFilter?: string,
      organizationIdsFilter?: string[] | null,
    ) => {
      if (scope === INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE) {
        return Promise.resolve(individuallySavedOpportunities);
      }
      // The page now fetches DEFAULT scope separately to determine whether the
      // user has any saved opportunities at all, so always return the combined
      // list for that unfiltered request.
      if (
        scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
        statusFilter === undefined &&
        organizationIdsFilter === undefined
      ) {
        return Promise.resolve(combinedSavedOpportunities);
      }

      if (
        scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE ||
        scope.scope === "organization" ||
        statusFilter !== undefined ||
        organizationIdsFilter !== undefined
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

    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [],
      individuallySavedOpportunities: [],
    });

    getSessionMock.mockResolvedValue({
      token: "test-token",
      user_id: "user-1",
      email: "test@example.com",
    });
    getUserOrganizationsMock.mockResolvedValue([]);
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
          path: "/workspace",
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
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
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
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
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

  it("does not render the share button when the user has no organizations", async () => {
    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
    });
    opportunityMock.mockResolvedValue({ data: mockOpportunity });
    getUserOrganizationsMock.mockResolvedValue([]);

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(
      screen.queryByTestId("share-opportunity-button-id"),
    ).not.toBeInTheDocument();
  });

  it("renders the share button when the user has at least one organization", async () => {
    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
    });
    opportunityMock.mockResolvedValue({ data: mockOpportunity });
    getUserOrganizationsMock.mockResolvedValue([
      {
        organization_id: "org-1",
        sam_gov_entity: {
          legal_business_name: "Alpha Org",
          expiration_date: "",
          uei: "",
          ebiz_poc_email: "",
          ebiz_poc_first_name: "",
          ebiz_poc_last_name: "",
        },
      },
    ]);

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
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
    });

    opportunityMock.mockResolvedValue({ data: mockOpportunity });
    getUserOrganizationsMock.mockResolvedValue([
      {
        organization_id: "org-1",
        sam_gov_entity: {
          legal_business_name: "Alpha Org",
          expiration_date: "",
          uei: "",
          ebiz_poc_email: "",
          ebiz_poc_first_name: "",
          ebiz_poc_last_name: "",
        },
      },
      {
        organization_id: "org-2",
        sam_gov_entity: {
          legal_business_name: "Bravo Org",
          expiration_date: "",
          uei: "",
          ebiz_poc_email: "",
          ebiz_poc_first_name: "",
          ebiz_poc_last_name: "",
        },
      },
    ]);

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: defaultSearchParams,
    });
    render(component);

    expect(await screen.findByText("Individual")).toBeInTheDocument();
    expect(screen.getAllByText("Alpha Org").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bravo Org").length).toBeGreaterThan(0);
  });

  it("passes status filter to fetchSavedOpportunities when status param is provided", async () => {
    const forecastedOpportunity: BaseOpportunity = {
      ...mockOpportunity,
      opportunity_id: "forecasted-opp-id",
      opportunity_title: "Forecasted Opportunity",
      opportunity_status: "forecasted",
    };

    savedOpportunitiesMock.mockImplementation(
      (
        scope: SavedOpportunitiesScope,
        statusFilter?: string,
        organizationIdsFilter?: string[] | null,
      ) => {
        if (scope === INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE) {
          return Promise.resolve([]);
        }
        if (
          scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
          statusFilter === undefined &&
          organizationIdsFilter === undefined
        ) {
          return Promise.resolve([
            { opportunity_id: forecastedOpportunity.opportunity_id },
          ]);
        }

        if (
          scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
          statusFilter === "forecasted" &&
          organizationIdsFilter === null
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
      null,
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
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
        {
          opportunity_id: forecastedOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
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
      (
        scope: SavedOpportunitiesScope,
        statusFilter?: string,
        organizationIdsFilter?: string[] | null,
      ) => {
        if (scope === INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE) {
          return Promise.resolve([]);
        }

        if (
          scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
          statusFilter === undefined &&
          organizationIdsFilter === undefined
        ) {
          return Promise.resolve([
            { opportunity_id: mockOpportunity.opportunity_id },
          ]);
        }

        if (
          scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
          statusFilter === "archived" &&
          organizationIdsFilter === null
        ) {
          return Promise.resolve([]);
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
  it("keeps filters visible and shows filtered empty state when the selected organization has no saved opportunities", async () => {
    savedOpportunitiesMock.mockImplementation(
      (
        scope: SavedOpportunitiesScope,
        statusFilter?: string,
        organizationIdsFilter?: string[] | null,
      ) => {
        if (scope === INDIVIDUAL_SAVED_OPPORTUNITIES_SCOPE) {
          return Promise.resolve([
            { opportunity_id: mockOpportunity.opportunity_id },
          ]);
        }

        if (
          scope === DEFAULT_SAVED_OPPORTUNITY_SCOPE &&
          statusFilter === undefined &&
          organizationIdsFilter === undefined
        ) {
          return Promise.resolve([
            { opportunity_id: mockOpportunity.opportunity_id },
          ]);
        }

        if (
          scope.scope === "organization" &&
          organizationIdsFilter?.includes("org-1")
        ) {
          return Promise.resolve([]);
        }

        return Promise.resolve([]);
      },
    );

    getUserOrganizationsMock.mockResolvedValue([
      {
        organization_id: "org-1",
        sam_gov_entity: {
          legal_business_name: "Alpha Org",
          expiration_date: "",
          uei: "",
          ebiz_poc_email: "",
          ebiz_poc_first_name: "",
          ebiz_poc_last_name: "",
        },
      },
    ]);

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: Promise.resolve({ savedBy: "organization:org-1" }),
    });
    render(component);

    expect(screen.getByLabelText("ownershipFilter.label")).toBeInTheDocument();
    expect(screen.getByLabelText("statusFilter.label")).toBeInTheDocument();
    expect(
      screen.getByText("SavedOpportunities.noMatchingStatus"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("noSavedCTAParagraphOne"),
    ).not.toBeInTheDocument();
  });

  it("passes organization filter to fetchSavedOpportunities", async () => {
    const savedBy = "organization:org-1";

    const component = await SavedOpportunities({
      params: localeParams,
      searchParams: Promise.resolve({ savedBy }),
    });
    render(component);

    expect(savedOpportunitiesMock).toHaveBeenCalledWith(
      { scope: "organization", organizationIds: ["org-1"] },
      undefined,
      ["org-1"],
    );
  });

  it("passes accessibility scan", async () => {
    mockSavedOpportunitiesByScope({
      combinedSavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
      ],
      individuallySavedOpportunities: [
        {
          opportunity_id: mockOpportunity.opportunity_id,
        } as MinimalOpportunity,
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
