import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Opportunities from "src/app/[locale]/(base)/opportunities/page";
import { UnauthorizedError } from "src/errors";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { DeepPartial } from "src/utils/testing/commonTestUtils";
import { localeParams, useTranslationsMock } from "src/utils/testing/intlMocks";

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const opportunities = jest.fn().mockResolvedValue({ data: [] });

jest.mock("src/services/fetch/fetchers/searchFetcher", () => ({
  searchForOpportunities: () =>
    opportunities() as Promise<{ data: BaseOpportunity[] }>,
}));

describe("Opportunities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("no opportunities have been saved", () => {
    beforeEach(() => {
      opportunities.mockResolvedValue({ data: [] });
    });

    it("renders correct text", async () => {
      const component = await Opportunities({ params: localeParams });
      render(component);

      expect(await screen.findByText("primary")).toBeVisible();
      expect(await screen.findByText("secondary")).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      const component = await Opportunities({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("there was error fetching applications", () => {
    beforeEach(() => {
      opportunities.mockRejectedValue(new Error("failure"));
    });

    it("general errors render an alert", async () => {
      opportunities.mockRejectedValue(new Error("failure"));
      const component = await Opportunities({ params: localeParams });
      render(component);

      expect(await screen.findByTestId("alert")).toBeVisible();
    });

    it("unauthorized errors continue up the stack", async () => {
      opportunities.mockRejectedValue(
        new UnauthorizedError("No active session"),
      );
      await expect(Opportunities({ params: localeParams })).rejects.toThrow();
    });

    it("passes accessibility scan", async () => {
      opportunities.mockRejectedValue(new Error("failure"));
      const component = await Opportunities({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("an application is returned", () => {
    let basicOpportunity: { data: DeepPartial<BaseOpportunity>[] };
    beforeEach(() => {
      basicOpportunity = {
        data: [
          {
            agency_code: "HHS-ACF-FYSB",
            agency_name: "Administration for Children & Families - ACYF/FYSB",
            opportunity_id: "89a44d32-0d90-4514-85a9-d5491f1c454d",
            opportunity_status: "posted",
            opportunity_title: "Test Opportunity for SF424A 1.0",
          },
        ],
      };
    });

    it("passes accessibility scan", async () => {
      opportunities.mockResolvedValue(basicOpportunity);
      const component = await Opportunities({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });

    it("renders headings", async () => {
      opportunities.mockResolvedValue(basicOpportunity);
      const component = await Opportunities({ params: localeParams });
      render(component);

      expect(
        screen.getAllByText("tableHeadings.agency"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("tableHeadings.title"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("tableHeadings.status"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("tableHeadings.actions"),
      ).toHaveLength(2);
    });

    it("renders opportunity name and agency", async () => {
      opportunities.mockResolvedValue(basicOpportunity);
      const component = await Opportunities({ params: localeParams });
      render(component);

      expect(
        await screen.findByText("Test Opportunity for SF424A 1.0"),
      ).toBeVisible();
      expect(
        await screen.findByText(
          "Administration for Children & Families - ACYF/FYSB",
        ),
      ).toBeVisible();
    });

    describe("renders status", () => {
      it("if in draft", async () => {
        opportunities.mockResolvedValue(basicOpportunity);
        const component = await Opportunities({ params: localeParams });
        render(component);

        expect(await screen.findByText("posted")).toBeVisible();
      });
    });
  });
});
