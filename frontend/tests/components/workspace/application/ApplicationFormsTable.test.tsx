import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import competitionMock from "stories/components/application/competition.mock.json";

import { ApplicationFormsTable } from "src/components/workspace/ApplicationFormsTable";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const competitionForms = competitionMock.competition
  .competition_forms as unknown as CompetitionForms;
const applicationForms =
  competitionMock.application_forms as unknown as ApplicationFormDetail[];
const applicationId = "12345";

describe("CompetitionFormsTable", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <ApplicationFormsTable
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("Renders without errors", () => {
    render(
      <ApplicationFormsTable
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
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
});
