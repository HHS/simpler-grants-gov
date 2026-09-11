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
    OpportunityDetailsHeader: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div data-testid="opportunity-details-header">{children}</div>,
  }),
);

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunity/[id]/competition/_components/CompetitionForm",
  () => ({
    CompetitionForm: ({
      competition,
      readOnly,
    }: {
      competition?: { competition_id?: string };
      readOnly?: boolean;
    }) => (
      <div
        data-testid="competition-form"
        data-competition-id={competition?.competition_id ?? ""}
        data-read-only={String(Boolean(readOnly))}
      />
    ),
  }),
);

const mockGetOpportunityForGrantor = jest.fn();
const mockCreateCompetitionForGrantor = jest.fn();
const mockAllForms = jest.fn();
const mockCompetitionForms = jest.fn();

jest.mock("src/services/fetch/fetchers/grantorOpportunitiesFetcher", () => ({
  getOpportunityForGrantor: (...args: unknown[]) =>
    mockGetOpportunityForGrantor(...args) as unknown,
}));

jest.mock("src/services/fetch/fetchers/allFormsFetcher", () => ({
  getForms: (...args: unknown[]) => mockAllForms(...args) as unknown,
}));

const baseOpportunityData: DeepPartial<GrantorOpportunityDetail> = {
  opportunity_id: "opp-abc-123",
  opportunity_title: "Test Opportunity",
  is_draft: true,
  competitions: null,
};

describe("OpportunityCompetitionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when opportunity has no existing competition", () => {
    beforeEach(() => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData, competitions: null, is_draft: true },
      });
      mockCreateCompetitionForGrantor.mockResolvedValue({
        data: { competition_id: "new-competition-id" },
      });
      mockCompetitionForms.mockResolvedValue({
        data: [],
      });
      mockAllForms.mockResolvedValue({
        data: [
          {
            current_version: {
              legacy_form_version: "2.1",
              major_version: 4,
              minor_version: 0,
            },
            form_id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Application for Federal Assistance",
            short_name: "SF-424",
          },
        ],
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
          is_draft: true,
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

  describe("readOnly handling", () => {
    beforeEach(() => {
      mockAllForms.mockResolvedValue({
        data: [
          {
            current_version: {
              legacy_form_version: "2.1",
              major_version: 4,
              minor_version: 0,
            },
            form_id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Application for Federal Assistance",
            short_name: "SF-424",
          },
        ],
      });
    });

    it("passes readOnly=false to CompetitionForm while the opportunity is draft", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData, is_draft: true, competitions: null },
      });

      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(
        screen.getByRole("button", { name: "button.saveAndExit" }),
      ).toBeEnabled();
      expect(screen.getByTestId("competition-form")).toHaveAttribute(
        "data-read-only",
        "false",
      );
    });

    it("passes readOnly=true to CompetitionForm when the opportunity is not a draft", async () => {
      mockGetOpportunityForGrantor.mockResolvedValue({
        data: { ...baseOpportunityData, is_draft: false, competitions: null },
      });

      const component = await OpportunityCompetitionPage({
        params: pageParams,
      });
      render(component);

      expect(
        screen.getByRole("button", { name: "button.saveAndExit" }),
      ).toBeDisabled();
      expect(screen.getByTestId("competition-form")).toHaveAttribute(
        "data-read-only",
        "true",
      );
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
