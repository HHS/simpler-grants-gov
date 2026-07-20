import { fireEvent, render, screen } from "@testing-library/react";
import OpportunityEditPage from "src/app/[locale]/(base)/grantor/opportunity/[id]/edit/page";
import { LocalizedPageProps } from "src/types/intl";
import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;
const mockUseActionState = jest.fn();
const redirectMock = jest.fn();

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}));

const withFeatureFlagMock = jest
  .fn()
  .mockImplementation(
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      _featureFlagName: string,
      _onEnabled: onEnabled,
    ) =>
      (props: { params: Promise<{ locale: string }> }) =>
        WrappedComponent(props) as unknown,
  );

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      featureFlagName: string,
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
        featureFlagName,
        onEnabled,
      )(props) as FunctionComponent<LocalizedPageProps>,
}));

jest.mock("next/navigation", () => ({
  redirect: (location: string) => redirectMock(location) as unknown,
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/grantor/opportunities",
  useSearchParams: () => new URLSearchParams("page=1"),
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useActionState: () => mockUseActionState() as unknown,
}));

const mockGetOpportunityForGrantor = jest.fn().mockResolvedValue({
  data: {
    opportunity_id: "opportunity-123",
    forecast_summary: { opportunity_summary_id: "summary-1" },
  },
});
jest.mock(
  "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher",
  () => ({
    getOpportunityForGrantor: (arg: unknown): unknown =>
      mockGetOpportunityForGrantor(arg) as Promise<GrantorOpportunityDetail[]>,
  }),
);

const pageParams = new Promise<{ id: string; locale: string }>((resolve) => {
  resolve({ id: "opportunity-123", locale: "en" });
});

describe("OpportunityEditForm — action buttons", () => {
  beforeEach(() => {
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      jest.fn(),
      false,
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the saveAndExit button", async () => {
    const component = await OpportunityEditPage({ params: pageParams });
    render(component);
    expect(
      screen.getByRole("button", { name: "button.saveAndExit" }),
    ).toBeInTheDocument();
  });

  it("calls the form action when saveAndExit is clicked", async () => {
    const mockFormAction = jest.fn();
    mockUseActionState.mockReturnValue([
      { validationErrors: {} },
      mockFormAction,
      false,
    ]);

    const component = await OpportunityEditPage({ params: pageParams });
    render(component);

    fireEvent.click(screen.getByRole("button", { name: "button.saveAndExit" }));

    expect(mockFormAction).toHaveBeenCalledTimes(1);
  });
});
