import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
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
  getTranslations: identity,
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
const mockCreateCompetitionForGrantor = jest.fn();

jest.mock(
  "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher",
  () => ({
    getOpportunityForGrantor: (...args: unknown[]) =>
      mockGetOpportunityForGrantor(...args) as unknown,
    createCompetitionForGrantor: (...args: unknown[]) =>
      mockCreateCompetitionForGrantor(...args) as unknown,
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
      mockCreateCompetitionForGrantor.mockResolvedValue({
        data: { competition_id: "new-competition-id" },
      });
    });

    it("calls createCompetitionForGrantor when competitions is an empty array", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData, competitions: [] },
      });
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(mockCreateCompetitionForGrantor).toHaveBeenCalledTimes(1);
      expect(mockCreateCompetitionForGrantor).toHaveBeenCalledWith(
        testOpportunityId,
      );
    });

    it("calls createCompetitionForGrantor with the opportunity id", async () => {
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(mockCreateCompetitionForGrantor).toHaveBeenCalledTimes(1);
      expect(mockCreateCompetitionForGrantor).toHaveBeenCalledWith(
        testOpportunityId,
      );
    });

    it("passes the new competition_id to CompetitionForm", async () => {
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(screen.getByTestId("competition-form")).toHaveAttribute(
        "data-competition-id",
        "new-competition-id",
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

    it("does not call createCompetitionForGrantor", async () => {
      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(mockCreateCompetitionForGrantor).not.toHaveBeenCalled();
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

    it("returns UnauthorizedMessage when createCompetitionForGrantor throws MissingAuthError", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData, competitions: null },
      });
      mockCreateCompetitionForGrantor.mockRejectedValue(
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
