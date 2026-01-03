import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ApplicationDetail } from "src/types/applicationResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import competitionMock from "stories/components/application/competition.mock.json";



import { ApplicationFormsTable } from "src/components/application/ApplicationFormsTable";


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

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const applicationDetailsObject: ApplicationDetail = {
  ...(competitionMock as unknown as ApplicationDetail),
  application_status: "in_progress",
  application_id: "12345",
  competition: {
    ...(competitionMock.competition as unknown as ApplicationDetail["competition"]),
    competition_instructions: [], // ensure property exists
  },
};

describe("CompetitionFormsTable", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        errors={null}
        applicationDetailsObject={applicationDetailsObject}
      />,
    );
    const results = await axe(container);
    expect(results).not.toHaveNoViolations();
  });
  it("Renders without errors", () => {
    render(
      <ApplicationFormsTable
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
  it("matches snapshot", () => {
    const { container } = render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        errors={null}
        applicationDetailsObject={applicationDetailsObject}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
