import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import OpportunityListing from "src/app/[locale]/(base)/opportunity/[id]/page";
import * as opportunityFetcher from "src/services/fetch/fetchers/opportunityFetcher";
import { OpportunityApiResponse } from "src/types/opportunity/opportunityResponseTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";
import { mockOpportunityDetail } from "src/utils/testing/fixtures";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

// namespaced keys so headings from different sections can be told apart
jest.mock("next-intl", () => ({
  useTranslations:
    (namespace = "") =>
    (key: string) =>
      `${namespace}.${key}`,
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

jest.mock(
  "src/app/[locale]/(base)/opportunity/[id]/_components/OpportunityCompetitionStart",
  () => ({
    OpportunityCompetitionStart: () => <div />,
  }),
);

jest.mock(
  "src/components/simpler-opportunity/OpportunitySaveUserControl",
  () => ({
    OpportunitySaveUserControl: () => <div />,
  }),
);

// agency and assistance listing details are header content, outside the page body
jest.mock("./_components/OpportunityIntro", () => ({
  __esModule: true,
  default: () => <div />,
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

  describe("page body", () => {
    const renderPage = async (overrides: Record<string, unknown> = {}) => {
      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockResolvedValue({
          data: {
            ...mockOpportunityDetail,
            summary: {
              ...mockOpportunityDetail.summary,
              summary_description: "Summary of the opportunity",
              additional_info_url: "https://example.com/info",
            },
            ...overrides,
          },
        } as unknown as OpportunityApiResponse);
      render(await OpportunityListing({ params: opportunityParams }));
    };

    it("renders each section once, in mobile reading order, with the expected heading levels", async () => {
      await renderPage();

      const headings = screen
        .getAllByRole("heading")
        .map(
          (heading) => `h${heading.tagName.slice(1)} ${heading.textContent}`,
        );

      expect(headings).toEqual([
        `h2 ${mockOpportunityDetail.opportunity_title}`,
        "h2 OpportunityListing.importantDates.title",
        "h2 OpportunityListing.awardInfo.title",
        "h2 OpportunityListing.history.title",
        "h2 OpportunityListing.summary.title",
        "h2 OpportunityListing.eligibility.title",
        "h3 OpportunityListing.eligibility.additionalInfo",
        "h2 OpportunityListing.documents.title",
        "h2 OpportunityListing.agencyContact.title",
        "h2 OpportunityListing.link.title",
      ]);
    });

    it("moves keyboard focus through the details before the content", async () => {
      await renderPage();
      const user = userEvent.setup();

      const focusOrder: string[] = [];
      for (let i = 0; i < 4; i++) {
        await user.tab();
        focusOrder.push(document.activeElement?.textContent ?? "");
      }

      expect(focusOrder).toEqual([
        "OpportunityListing.history.versionHistory",
        "OpportunityListing.summary.jumpToDocuments",
        "https://example.com/info",
        "OpportunityListing.link.viewOnGrantsGov",
      ]);
    });

    it("still renders the jump link when there is no summary", async () => {
      await renderPage({
        summary: {
          ...mockOpportunityDetail.summary,
          summary_description: null,
        },
      });

      expect(
        screen.queryByRole("heading", {
          name: "OpportunityListing.summary.title",
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", {
          name: "OpportunityListing.summary.jumpToDocuments",
        }),
      ).toHaveAttribute("href", "#opportunity-documents");
      const documentsHeading = screen.getByRole("heading", {
        name: "OpportunityListing.documents.title",
      });
      // eslint-disable-next-line testing-library/no-node-access
      const documentsSection = documentsHeading.closest(
        "#opportunity-documents",
      );
      expect(documentsSection).toBeInTheDocument();
    });

    it("links to Grants.gov from the additional information list instead of a button", async () => {
      await renderPage();

      const legacyLink = screen.getByRole("link", {
        name: "OpportunityListing.link.viewOnGrantsGov",
      });
      // eslint-disable-next-line testing-library/no-node-access
      const legacyListItem = legacyLink.closest("li");
      expect(legacyListItem).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /grants\.gov/i }),
      ).not.toBeInTheDocument();
    });
  });
});
