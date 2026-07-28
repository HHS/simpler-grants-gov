import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import OpportunityOverviewPage from "src/app/[locale]/(base)/grantor/opportunity/[id]/overview/page";
import { ForbiddenError, MissingAuthError, NotFoundError } from "src/errors";
import { Competition } from "src/types/competitionsResponseTypes";
import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import {
  DeepPartial,
  wrapForExpectedError,
} from "src/utils/testing/commonTestUtils";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

const testOpportunityId = "opp-abc-123";
const pageParams = Promise.resolve({ id: testOpportunityId, locale: "en" });
const emptySearchParams = Promise.resolve({});

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}));

const mockNotFound = jest.fn();
jest.mock("next/navigation", () => ({
  notFound: (...args: unknown[]) => mockNotFound(...args) as unknown,
  redirect: jest.fn(),
}));

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: (WrappedComponent: React.FunctionComponent) => (props: unknown) =>
    WrappedComponent(props as never),
}));

const mockGetOpportunityForGrantor = jest.fn();
jest.mock(
  "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher",
  () => ({
    getOpportunityForGrantor: (...args: unknown[]) =>
      mockGetOpportunityForGrantor(...args) as unknown,
  }),
);

jest.mock(
  "src/components/grantor-opportunities/OpportunityDetailsHeader",
  () => ({
    OpportunityDetailsHeader: ({
      isNewlyCreated,
      children,
    }: {
      isNewlyCreated?: boolean;
      children?: React.ReactNode;
    }) => (
      <div
        data-testid="opportunity-details-header"
        data-is-newly-created={String(!!isNewlyCreated)}
      >
        {children}
      </div>
    ),
  }),
);

jest.mock("./_components/OverviewButtons", () => ({
  OverviewButtons: ({ publishEnabled }: { publishEnabled: boolean }) => (
    <div
      data-testid="overview-buttons"
      data-publish-enabled={String(publishEnabled)}
    />
  ),
}));

// Fixture builders shaped relative to summaryRequiredFields / competitionRequiredFields
// (RequiredFields.tsx) so ProgressChecker's real getProgress() logic determines the
// status - not mocked, exercised for real.
type ProgressStatus = "notStarted" | "inProgress" | "complete";

function buildSummaryFixture(status: ProgressStatus) {
  if (status === "notStarted") return {};
  if (status === "inProgress") return { funding_instruments: ["grant"] };
  return {
    funding_instruments: ["grant"],
    funding_categories: ["health"],
    post_date: "2026-01-01",
    applicant_types: ["individuals"],
  };
}

function buildCompetitionFixture(
  status: ProgressStatus,
): DeepPartial<[Competition]> | null {
  if (status === "notStarted") return null;
  if (status === "inProgress") return [{ competition_id: "comp-1" }];
  return [{ competition_id: "comp-1", open_to_applicants: ["individual"] }];
}

const baseOpportunityData: DeepPartial<GrantorOpportunityDetail> = {
  opportunity_id: testOpportunityId,
  opportunity_title: "Test Opportunity",
  is_draft: true,
  summary: {},
  competitions: null,
};

// Modular link+status section config. Add a new entry here (plus a small
// buildXFixture helper if needed) to cover a future Overview link - the
// describe.each/it.each block below needs no changes. `hrefSuffix` must
// match the row's `data-testid="overview-row-{hrefSuffix}"` in page.tsx.
type OverviewSectionCase = {
  name: string;
  linkNameKey: string;
  hrefSuffix: string;
  buildData: (status: ProgressStatus) => DeepPartial<GrantorOpportunityDetail>;
};

const OVERVIEW_SECTIONS: OverviewSectionCase[] = [
  {
    name: "Opportunity Summary",
    linkNameKey: "labels.editOpportunityLink",
    hrefSuffix: "edit",
    buildData: (status) => ({ summary: buildSummaryFixture(status) }),
  },
  {
    name: "Application Package",
    linkNameKey: "labels.competitionLink",
    hrefSuffix: "competition",
    buildData: (status) => ({ competitions: buildCompetitionFixture(status) }),
  },
];

describe("OpportunityOverviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each(OVERVIEW_SECTIONS)("$name section", (section) => {
    it.each(["notStarted", "inProgress", "complete"] as const)(
      "shows %s status and links to the correct page",
      async (status) => {
        mockGetOpportunityForGrantor.mockResolvedValue({
          data: { ...baseOpportunityData, ...section.buildData(status) },
        });

        const component = await OpportunityOverviewPage({
          params: pageParams,
          searchParams: emptySearchParams,
        });
        render(component);

        // Row is found via data-testid="overview-row-{hrefSuffix}" on the
        // page's own row markup, so both the link and status assertions
        // stay scoped correctly once a 3rd/4th section is added alongside it.
        const row = screen.getByTestId(`overview-row-${section.hrefSuffix}`);
        const link = within(row).getByRole("link", {
          name: section.linkNameKey,
        });
        expect(link).toHaveAttribute(
          "href",
          `../${testOpportunityId}/${section.hrefSuffix}`,
        );
        expect(within(row).getByText(status)).toBeInTheDocument();
      },
    );
  });

  describe("error handling", () => {
    it("calls notFound() on a 404", async () => {
      mockGetOpportunityForGrantor.mockRejectedValue(
        new NotFoundError("not found"),
      );

      // The real Next.js notFound() throws to halt rendering; the mocked
      // version doesn't, so execution falls through to the page's final
      // `throw error` - wrap in wrapForExpectedError to catch that,
      // matching the established pattern in opportunity/[id]/page.test.tsx.
      await wrapForExpectedError(() =>
        OpportunityOverviewPage({
          params: pageParams,
          searchParams: emptySearchParams,
        }),
      );

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it("shows UnauthorizedMessage on a 403", async () => {
      mockGetOpportunityForGrantor.mockRejectedValue(
        new ForbiddenError("forbidden"),
      );

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      render(component);

      expect(screen.getByTestId("alert")).toBeVisible();
    });

    it("shows UnauthorizedMessage when getOpportunityForGrantor throws MissingAuthError", async () => {
      mockGetOpportunityForGrantor.mockRejectedValue(
        new MissingAuthError("missing auth"),
      );

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      render(component);

      expect(screen.getByTestId("alert")).toBeVisible();
    });
  });

  describe("publishEnabled", () => {
    it("enables publish when a draft and both sections are complete", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: {
          ...baseOpportunityData,
          is_draft: true,
          summary: buildSummaryFixture("complete"),
          competitions: buildCompetitionFixture("complete"),
        },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      render(component);

      expect(screen.getByTestId("overview-buttons")).toHaveAttribute(
        "data-publish-enabled",
        "true",
      );
    });

    it("disables publish when not a draft, even if both sections are complete", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: {
          ...baseOpportunityData,
          is_draft: false,
          summary: buildSummaryFixture("complete"),
          competitions: buildCompetitionFixture("complete"),
        },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      render(component);

      expect(screen.getByTestId("overview-buttons")).toHaveAttribute(
        "data-publish-enabled",
        "false",
      );
    });

    it("disables publish when one section is in progress, even if the other is complete", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: {
          ...baseOpportunityData,
          is_draft: true,
          summary: buildSummaryFixture("complete"),
          competitions: buildCompetitionFixture("inProgress"),
        },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      render(component);

      expect(screen.getByTestId("overview-buttons")).toHaveAttribute(
        "data-publish-enabled",
        "false",
      );
    });

    it("disables publish when both sections are not started", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: {
          ...baseOpportunityData,
          is_draft: true,
          summary: buildSummaryFixture("notStarted"),
          competitions: buildCompetitionFixture("notStarted"),
        },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      render(component);

      expect(screen.getByTestId("overview-buttons")).toHaveAttribute(
        "data-publish-enabled",
        "false",
      );
    });
  });

  describe("isNewlyCreated", () => {
    it("passes isNewlyCreated through when fromCreate=true", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: Promise.resolve({ fromCreate: "true" }),
      });
      render(component);

      expect(screen.getByTestId("opportunity-details-header")).toHaveAttribute(
        "data-is-newly-created",
        "true",
      );
    });

    it("does not set isNewlyCreated when fromCreate is absent", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      render(component);

      expect(screen.getByTestId("opportunity-details-header")).toHaveAttribute(
        "data-is-newly-created",
        "false",
      );
    });
  });

  describe("accessibility", () => {
    it("passes accessibility scan when nothing is started", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: {
          ...baseOpportunityData,
          summary: buildSummaryFixture("notStarted"),
          competitions: buildCompetitionFixture("notStarted"),
        },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      const { container } = render(component);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it("passes accessibility scan when both sections are complete", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: {
          ...baseOpportunityData,
          summary: buildSummaryFixture("complete"),
          competitions: buildCompetitionFixture("complete"),
        },
      });

      const component = await OpportunityOverviewPage({
        params: pageParams,
        searchParams: emptySearchParams,
      });
      const { container } = render(component);
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });
  });
});
