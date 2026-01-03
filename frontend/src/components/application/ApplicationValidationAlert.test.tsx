import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import { CompetitionForms } from "src/types/competitionsResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import competitionMock from "stories/components/application/competition.mock.json";

import ApplicationValidationAlert from "src/components/application/ApplicationValidationAlert";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));
const competitionForms = competitionMock.competition
  .competition_forms as unknown as CompetitionForms;
const applicationForms =
  competitionMock.application_forms as unknown as ApplicationFormDetail[];

describe("ApplicationValidationAlert", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(
      <ApplicationValidationAlert
        forms={competitionForms}
        applicationForms={applicationForms}
        validationErrors={[]}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("should show notStartedForm error", () => {
    render(
      <ApplicationValidationAlert
        forms={competitionForms}
        applicationForms={applicationForms}
        validationErrors={[
          {
            field: "form_id",
            value: "123e4567-e89b-12d3-a456-426614174000",
            type: "missing_required_form",
            message: "yolo",
          },
        ]}
      />,
    );

    const alerts = screen.getAllByTestId("alert");
    expect(alerts[0]).toHaveTextContent("notStartedForm");
    expect(alerts[0]).toHaveTextContent("ABC Project Form");
    expect(alerts[0]).not.toHaveTextContent("incompleteForm");
  });
  it("should show incompleteForm error", () => {
    render(
      <ApplicationValidationAlert
        forms={competitionForms}
        applicationForms={applicationForms}
        validationErrors={[
          {
            field: "form_id",
            value: "123e4567-e89b-12d3-a456-426614174001",
            type: "application_form_validation",
            message: "yolo",
          },
        ]}
      />,
    );

    const alerts = screen.getAllByTestId("alert");
    expect(alerts[0]).toHaveTextContent("incompleteForm");
    expect(alerts[0]).toHaveTextContent("DEF Project Form");
    expect(alerts[0]).not.toHaveTextContent("notStartedForm");
  });
  it("should show both errors", () => {
    render(
      <ApplicationValidationAlert
        forms={competitionForms}
        applicationForms={applicationForms}
        validationErrors={[
          {
            field: "application_form_id",
            value: "123e4567-e89b-12d3-a456-426614174001",
            type: "application_form_validation",
            message: "yolo",
          },
          {
            field: "form_id",
            value: "123e4567-e89b-12d3-a456-426614174001",
            type: "missing_required_form",
            message: "yolo",
          },
        ]}
      />,
    );

    const alerts = screen.getAllByTestId("alert");
    expect(alerts[0]).toHaveTextContent("notStartedForm");
    expect(alerts[0]).toHaveTextContent("ABC Project Form");
    expect(alerts[0]).toHaveTextContent("incompleteForm");
    expect(alerts[0]).toHaveTextContent("DEF Project Form");
  });
});
