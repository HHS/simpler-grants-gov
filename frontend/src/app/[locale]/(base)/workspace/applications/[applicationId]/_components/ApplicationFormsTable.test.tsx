import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ApplicationFormsTable } from "src/app/[locale]/(base)/workspace/applications/[applicationId]/_components/ApplicationFormsTable";
import {
  ApplicationDetail,
  ApplicationFormDetail,
  ApplicationStatus,
} from "src/types/applicationResponseTypes";
import competitionMock from "stories/components/application/competition.mock.json";

import React from "react";

const clientFetchMock = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

// The global next-intl mock's `.rich` ignores the render functions it is
// given, which would hide the conditionalFormsDescription instructions
// link this suite needs to click. Override it locally so that one key
// actually invokes its `instructionsLink` renderer.
jest.mock("next-intl", () => ({
  useTranslations: () => {
    const translationFunction = ((key: string) => key) as ((
      key: string,
    ) => string) & {
      rich: (
        key: string,
        values: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
      ) => React.ReactNode;
    };

    translationFunction.rich = (key, values) => {
      if (key === "conditionalFormsDescription") {
        const instructionsLink = values.instructionsLink;
        return instructionsLink ? (
          <>{instructionsLink("download the instructions")}</>
        ) : (
          key
        );
      }
      return key;
    };

    return translationFunction;
  },
}));

const applicationForms =
  competitionMock.application_forms as unknown as ApplicationFormDetail[];
const applicationDetailsObject: ApplicationDetail = {
  ...(competitionMock as unknown as ApplicationDetail),
  application_status: ApplicationStatus.IN_PROGRESS,
  application_id: "12345",
  competition: {
    ...(competitionMock.competition as unknown as ApplicationDetail["competition"]),
    competition_instructions: [], // ensure property exists
    opportunity: {
      opportunity_id: "opp-1",
    } as unknown as ApplicationDetail["competition"]["opportunity"],
  },
};

describe("ApplicationFormsTable", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <ApplicationFormsTable
        applicationForms={applicationForms}
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        errors={null}
        applicationDetailsObject={applicationDetailsObject}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("Renders without errors", () => {
    render(
      <ApplicationFormsTable
        applicationForms={applicationForms}
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        errors={null}
        applicationDetailsObject={applicationDetailsObject}
      />,
    );

    const tables = screen.getAllByTestId("table");

    expect(tables[0]).toHaveTextContent("ABC Project Form");
    expect(tables[0]).toHaveTextContent("in_progress");
    expect(tables[0]).toHaveTextContent("attachmentUnavailable");

    expect(tables[1]).toHaveTextContent("DEF Project Form");
    expect(tables[1]).toHaveTextContent("complete");
    expect(tables[1]).toHaveTextContent("downloadInstructions");
  });

  describe("Apply interaction events", () => {
    const readBlobAsText = (blob: Blob): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("failed to read blob"));
        reader.readAsText(blob);
      });

    let sendBeaconMock: jest.Mock;

    beforeEach(() => {
      sendBeaconMock = jest.fn();
      Object.defineProperty(navigator, "sendBeacon", {
        value: sendBeaconMock,
        writable: true,
      });
    });

    it("sends click_download_form_instructions with applicationId, opportunityId, and formId", async () => {
      const user = userEvent.setup();
      render(
        <ApplicationFormsTable
          applicationForms={applicationForms}
          competitionInstructionsDownloadPath="http://path-to-instructions.com"
          errors={null}
          applicationDetailsObject={applicationDetailsObject}
        />,
      );

      await user.click(
        screen.getByRole("link", { name: "downloadInstructions" }),
      );

      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
      const [url, blob] = sendBeaconMock.mock.calls[0] as [string, Blob];
      expect(url).toBe("/api/events");
      expect(JSON.parse(await readBlobAsText(blob))).toEqual({
        name: "click_download_form_instructions",
        properties: {
          applicationId: "12345",
          opportunityId: "opp-1",
          formId: "123e4567-e89b-12d3-a456-426614174001",
        },
      });
    });

    it("sends click_download_conditional_forms_instructions with applicationId and opportunityId", async () => {
      const user = userEvent.setup();
      render(
        <ApplicationFormsTable
          applicationForms={applicationForms}
          competitionInstructionsDownloadPath="http://path-to-instructions.com"
          errors={null}
          applicationDetailsObject={applicationDetailsObject}
        />,
      );

      await user.click(
        screen.getByRole("link", { name: "download the instructions" }),
      );

      expect(sendBeaconMock).toHaveBeenCalledTimes(1);
      const [url, blob] = sendBeaconMock.mock.calls[0] as [string, Blob];
      expect(url).toBe("/api/events");
      expect(JSON.parse(await readBlobAsText(blob))).toEqual({
        name: "click_download_conditional_forms_instructions",
        properties: { applicationId: "12345", opportunityId: "opp-1" },
      });
    });
  });
});
