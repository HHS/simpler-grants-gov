import { identity } from "lodash";
import OpportunityListing from "src/app/[locale]/(base)/opportunity/[id]/page";
import * as opportunityFetcher from "src/services/fetch/fetchers/opportunityFetcher";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

const mockRedirect = jest.fn((..._args: unknown[]) => {
  throw new Error("NEXT_REDIRECT");
});

jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  redirect: (...args: unknown[]) => mockRedirect(...args),
  RedirectType: { push: "push" },
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn().mockResolvedValue(null),
}));

jest.mock("src/services/fetch/fetchers/opportunityFetcher");
jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher");

jest.mock("src/components/ContentLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("src/components/opportunity/OpportunityIntro", () => ({
  __esModule: true,
  default: () => <div data-testid="opportunity-intro" />,
}));

jest.mock("src/components/opportunity/OpportunityDescription", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("src/components/opportunity/OpportunityDocuments", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("src/components/opportunity/OpportunityLink", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("src/components/opportunity/OpportunityStatusWidget", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("src/components/opportunity/OpportunityCTA", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("src/components/opportunity/OpportunityAwardInfo", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("src/components/opportunity/OpportunityHistory", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("src/components/user/OpportunityCompetitionStart", () => ({
  OpportunityCompetitionStart: () => <div />,
}));

jest.mock("src/components/user/OpportunitySaveUserControl", () => ({
  OpportunitySaveUserControl: () => <div />,
}));

const opportunityParams = Promise.resolve({
  locale: "en",
  id: mockOpportunityDetail.opportunity_id,
});

describe("OpportunityListing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls notFound() when opportunity returns 404", async () => {
    jest
      .spyOn(opportunityFetcher, "getOpportunityDetails")
      .mockRejectedValue(new Error(JSON.stringify({ status: 404 })));

    await wrapForExpectedError(() =>
      OpportunityListing({
        params: opportunityParams,
      }),
    );

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("throws non-404 errors without calling notFound()", async () => {
    jest
      .spyOn(opportunityFetcher, "getOpportunityDetails")
      .mockRejectedValue(new Error("Internal Server Error"));

    await expect(
      OpportunityListing({
        params: opportunityParams,
      }),
    ).rejects.toThrow("Internal Server Error");

    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
