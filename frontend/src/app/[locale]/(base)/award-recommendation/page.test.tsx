import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import AwardRecommendationsListPage, {
  generateMetadata,
} from "src/app/[locale]/(base)/award-recommendation/page";
import { MissingAuthError } from "src/errors";
import { UserSession } from "src/types/authTypes";
import { LocalizedPageProps } from "src/types/intl";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const redirectMock = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (location: string) => redirectMock(location) as unknown,
}));

const withFeatureFlagMock = jest.fn();

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      _featureFlagName: string,
      onEnabled: onEnabled,
    ) =>
    (props: LocalizedPageProps) =>
      (
        withFeatureFlagMock as FeatureFlaggedPageWrapper<
          LocalizedPageProps,
          ReactNode
        >
      )(
        WrappedComponent,
        _featureFlagName,
        onEnabled,
      )(props) as FunctionComponent<LocalizedPageProps>,
}));

jest.mock(
  "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListContent",
  () => ({
    __esModule: true,
    default: () => <div data-testid="award-recommendations-list-content" />,
  }),
);

jest.mock(
  "src/components/award-recommendation/AwardRecommendationHero",
  () => ({
    __esModule: true,
    default: ({ heading }: { heading?: string }) => (
      <div data-testid="award-recommendation-hero">{heading}</div>
    ),
  }),
);

const mockGetSession = jest.fn();
const mockGetUserAgencies = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession() as Promise<UserSession | null>,
}));

jest.mock("src/services/fetch/fetchers/agenciesFetcher", () => ({
  getUserAgencies: (userId: string) =>
    mockGetUserAgencies(userId) as Promise<RelevantAgencyRecord[]>,
}));

const agencies: RelevantAgencyRecord[] = [
  {
    agency_id: 1,
    agency_name: "Agency One",
    agency_code: "A1",
    top_level_agency: null,
  },
];

describe("AwardRecommendationsListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withFeatureFlagMock.mockImplementation(
      (
        WrappedComponent: FunctionComponent<LocalizedPageProps>,
        _featureFlagName: string,
        _onEnabled: onEnabled,
      ) =>
        (props: {
          params: Promise<{ locale: string }>;
          searchParams?: Promise<Record<string, string>>;
        }) =>
          WrappedComponent(props) as unknown,
    );
    mockGetSession.mockResolvedValue({
      token: "token",
      user_id: "user-id",
    });
    mockGetUserAgencies.mockResolvedValue(agencies);
  });

  it("generates metadata", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata).toEqual({
      title: "AwardRecommendation.list.pageTitle",
      description: "AwardRecommendation.metaDescription",
    });
  });

  it("redirects to the first agency when none is selected", async () => {
    await AwardRecommendationsListPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });

    expect(redirectMock).toHaveBeenCalledWith("?agency=1");
  });

  it("renders the list content when an agency is selected", async () => {
    const page = await AwardRecommendationsListPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ agency: "1" }),
    });

    render(page);

    expect(screen.getByTestId("award-recommendation-hero")).toHaveTextContent(
      "list.pageHeading",
    );
    expect(
      screen.getByTestId("award-recommendations-list-content"),
    ).toBeInTheDocument();
  });

  it("renders the unauthenticated page when agencies cannot be loaded", async () => {
    mockGetUserAgencies.mockRejectedValue(new MissingAuthError("Missing auth"));

    const page = await AwardRecommendationsListPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ agency: "1" }),
    });

    render(page);

    expect(screen.getByText("unauthenticated")).toBeInTheDocument();
  });
});
