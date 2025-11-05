import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Applications from "src/app/[locale]/(base)/applications/page";
import { UnauthorizedError } from "src/errors";
import { ApplicationDetail } from "src/types/applicationResponseTypes";
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

const applications = jest.fn().mockResolvedValue([]);

jest.mock("src/services/fetch/fetchers/applicationsFetcher", () => ({
  fetchApplications: () => applications() as Promise<ApplicationDetail[]>,
}));

describe("Applications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("no applications have been saved", () => {
    beforeEach(() => {
      applications.mockResolvedValue([]);
    });

    it("renders correct text", async () => {
      const component = await Applications({ params: localeParams });
      render(component);

      expect(
        await screen.findByText("noApplicationsMessage.primary"),
      ).toBeVisible();
      expect(
        await screen.findByText("noApplicationsMessage.secondary"),
      ).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      const component = await Applications({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("there was error fetching applications", () => {
    beforeEach(() => {
      applications.mockRejectedValue(new Error("failure"));
    });

    it("general errors render an alert", async () => {
      applications.mockRejectedValue(new Error("failure"));
      const component = await Applications({ params: localeParams });
      render(component);

      expect(await screen.findByTestId("alert")).toBeVisible();
    });

    it("unauthorized errors continue up the stack", async () => {
      applications.mockRejectedValue(
        new UnauthorizedError("No active session"),
      );
      await expect(Applications({ params: localeParams })).rejects.toThrow();
    });

    it("passes accessibility scan", async () => {
      applications.mockRejectedValue(new Error("failure"));
      const component = await Applications({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });
  });

  describe("an application is returned", () => {
    let basicApplication: DeepPartial<ApplicationDetail>;
    beforeEach(() => {
      basicApplication = {
        application_id: "1a4d247b-ca08-4855-bdcd-e48432cd6d71",
        application_name: "first!!!",
        application_status: "in_progress",
        competition: {
          closing_date: "2025-11-11",
          competition_id: "642a4dda-8c13-4bc6-bbae-1a0d133d90a6",
          competition_title: "Truth common can board.",
          is_open: true,
          opening_date: "2025-10-26",
          opportunity: {
            agency_name: "Health Resources and Services Administration",
            opportunity_id: "c9e472ab-2561-4ac3-b514-63781bc6a404",
            opportunity_title: "Local Pilot-equivalent Opportunity",
          },
        },
      };
    });

    it("passes accessibility scan", async () => {
      applications.mockResolvedValue([basicApplication]);
      const component = await Applications({ params: localeParams });
      const { container } = render(component);
      const results = await waitFor(() => axe(container));

      expect(results).toHaveNoViolations();
    });

    it("renders headings", async () => {
      applications.mockResolvedValue([basicApplication]);
      const component = await Applications({ params: localeParams });
      render(component);

      expect(
        screen.getAllByText("Applications.tableHeadings.closeDate"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.status"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.applicationName"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.type"),
      ).toHaveLength(2);
      expect(
        screen.getAllByText("Applications.tableHeadings.opportunity"),
      ).toHaveLength(2);
    });

    it("renders close date", async () => {
      applications.mockResolvedValue([basicApplication]);
      const component = await Applications({ params: localeParams });
      render(component);

      expect(await screen.findByText("November 11, 2025")).toBeVisible();
    });

    it("renders applicaiton filing name", async () => {
      applications.mockResolvedValue([basicApplication]);
      const component = await Applications({ params: localeParams });
      render(component);

      expect(await screen.findByText("first!!!")).toBeVisible();
    });

    it("renders opportunity name and agency", async () => {
      applications.mockResolvedValue([basicApplication]);
      const component = await Applications({ params: localeParams });
      render(component);

      expect(
        await screen.findByText("Local Pilot-equivalent Opportunity"),
      ).toBeVisible();
      expect(
        await screen.findByText("Health Resources and Services Administration"),
      ).toBeVisible();
    });

    describe("renders status", () => {
      it("if in draft", async () => {
        applications.mockResolvedValue([basicApplication]);
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.draft"),
        ).toBeVisible();
      });

      it("if submitted", async () => {
        applications.mockResolvedValue([
          { ...basicApplication, application_status: "submitted" },
        ]);
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.submitted"),
        ).toBeVisible();
      });

      it("if approved", async () => {
        applications.mockResolvedValue([
          { ...basicApplication, application_status: "approved" },
        ]);
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.submitted"),
        ).toBeVisible();
      });
    });

    describe("renders type", () => {
      it("if started as an individual", async () => {
        applications.mockResolvedValue([basicApplication]);
        const component = await Applications({ params: localeParams });
        render(component);

        expect(
          await screen.findByText("Applications.tableContents.individual"),
        ).toBeVisible();
      });

      it("if started as an orgnaization", async () => {
        applications.mockResolvedValue([
          {
            ...basicApplication,
            organization: {
              sam_gov_entity: { legal_business_name: "Great Organization" },
            },
          },
        ]);
        const component = await Applications({ params: localeParams });
        render(component);

        expect(await screen.findByText("Great Organization")).toBeVisible();
      });
    });
  });
});
