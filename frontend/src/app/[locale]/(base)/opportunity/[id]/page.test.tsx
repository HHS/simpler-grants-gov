import { render, screen } from "@testing-library/react";
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

jest.mock("./_components/OpportunityDescription", () => ({
  __esModule: true,
  default: () => <div data-testid="section">description</div>,
}));

jest.mock("./_components/OpportunityDocuments", () => ({
  __esModule: true,
  default: () => <div data-testid="section">documents</div>,
}));

jest.mock("./_components/OpportunityLink", () => ({
  __esModule: true,
  default: () => <div data-testid="section">link</div>,
}));

jest.mock("./_components/OpportunityContact", () => ({
  __esModule: true,
  default: () => <div data-testid="section">contact</div>,
}));

jest.mock("./_components/OpportunityImportantDates", () => ({
  __esModule: true,
  default: () => <div data-testid="section">important-dates</div>,
}));

jest.mock("./_components/OpportunityAwardInfo", () => ({
  __esModule: true,
  default: () => <div data-testid="section">award-details</div>,
}));

jest.mock("./_components/OpportunityHistory", () => ({
  __esModule: true,
  default: () => <div data-testid="section">history</div>,
}));

jest.mock("./_components/OpportunityHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="section">header</div>,
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

  it("renders the side column before the main column so reading order follows the mobile layout", async () => {
    jest.spyOn(opportunityFetcher, "getOpportunityDetails").mockResolvedValue({
      data: {
        ...mockOpportunityDetail,
        is_draft: false,
        is_simpler_grants_opportunity: true,
        submitted_application_count: 0,
      },
      message: "Success",
      status_code: 200,
    });

    render(await OpportunityListing({ params: opportunityParams }));

    expect(
      screen.getAllByTestId("section").map((section) => section.textContent),
    ).toEqual([
      "header",
      "important-dates",
      "award-details",
      "history",
      "description",
      "documents",
      "contact",
      "link",
    ]);
  });
});
