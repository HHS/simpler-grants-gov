import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import OpportunityCompetitionPage from "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/page";
import { MissingAuthError } from "src/errors";
import { GrantorOpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { DeepPartial } from "src/utils/testing/commonTestUtils";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

const testOpportunityId = "opp-abc-123";
const pageParams = Promise.resolve({ id: testOpportunityId, locale: "en" });

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: (WrappedComponent: React.FunctionComponent) => (props: unknown) =>
    WrappedComponent(props as never),
}));

jest.mock(
  "src/components/grantor-opportunities/OpportunityDetailsHeader",
  () => ({
    OpportunityDetailsHeader: () => (
      <div data-testid="opportunity-details-header" />
    ),
  }),
);

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/CompetitionForm",
  () => ({
    CompetitionForm: ({ competitionId }: { competitionId: string }) => (
      <div data-testid="competition-form" data-competition-id={competitionId} />
    ),
  }),
);

const mockGetOpportunityForGrantor = jest.fn();

jest.mock(
  "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher",
  () => ({
    getOpportunityForGrantor: (...args: unknown[]) =>
      mockGetOpportunityForGrantor(...args) as unknown,
  }),
);

const baseOpportunityData: DeepPartial<GrantorOpportunityDetail> = {
  opportunity_id: "opp-abc-123",
  opportunity_title: "Test Opportunity",
  competitions: null,
};

describe("OpportunityCompetitionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when opportunity has no existing competition", () => {
    beforeEach(() => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData, competitions: null },
      });
    });

    it("passes an empty string to CompetitionForm", async () => {
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(screen.getByTestId("competition-form")).toHaveAttribute(
        "data-competition-id",
        "",
      );
    });

    it("passes accessibility scan", async () => {
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("when opportunity already has a competition", () => {
    beforeEach(() => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: {
          ...baseOpportunityData,
          competitions: [{ competition_id: "existing-competition-id" }],
        },
      });
    });

    it("passes the existing competition_id to CompetitionForm", async () => {
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(screen.getByTestId("competition-form")).toHaveAttribute(
        "data-competition-id",
        "existing-competition-id",
      );
    });

    it("passes accessibility scan", async () => {
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("MissingAuthError handling", () => {
    it("returns UnauthorizedMessage when getOpportunityForGrantor throws MissingAuthError", async () => {
      mockGetOpportunityForGrantor.mockRejectedValue(
        new MissingAuthError("Missing auth"),
      );
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);
      expect(screen.getByTestId("alert")).toBeVisible();
    });
  });
});
