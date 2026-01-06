import { axe } from "jest-axe";
import type { ApplicationFormDetail } from "src/types/applicationResponseTypes";
import type { CompetitionForms } from "src/types/competitionsResponseTypes";
import competitionMock from "stories/components/application/competition.mock.json";
import { render, screen, within } from "tests/react-utils";

import React from "react";

import type { FormValidationWarning } from "src/components/applyForm/types";
import { ApplicationFormsTable } from "./ApplicationFormsTable";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("./IncludeFormInSubmissionRadio", () => ({
  IncludeFormInSubmissionRadio: () => <div data-testid="include-form-radio" />,
}));

const competitionForms = competitionMock.competition
  .competition_forms as unknown as CompetitionForms;

const applicationForms: ApplicationFormDetail[] =
  competitionMock.application_forms as unknown as ApplicationFormDetail[];

const applicationId = "12345";

describe("ApplicationFormsTable", () => {
  it("passes accessibility scan", async () => {
    const { container } = render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders required and conditional sections", () => {
    render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Required Forms" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Conditionally-Required Forms",
      }),
    ).toBeInTheDocument();
  });

  it("shows an instructions download link when present, otherwise shows Unavailable", () => {
    render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
      />,
    );

    // Required form: ABC shows Unavailable
    const abcRow = screen
      .getByRole("link", { name: "ABC Project Form" })
      .closest("tr");
    expect(abcRow).not.toBeNull();
    expect(
      within(abcRow as HTMLTableRowElement).getByText("Unavailable"),
    ).toBeInTheDocument();

    // Conditional form: DEF shows download link
    const defRow = screen
      .getByRole("link", { name: "DEF Project Form" })
      .closest("tr");
    expect(defRow).not.toBeNull();

    const downloadLink = within(defRow as HTMLTableRowElement).getByRole(
      "link",
      { name: "Download instructions" },
    );

    // Fixture currently has href="string" (as seen in your DOM output)
    expect(downloadLink).toHaveAttribute("href", "string");
  });

  it("renders the conditional description with a link when competition instructions are available", () => {
    const path = "http://path-to-instructions.com";

    render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath={path}
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
      />,
    );

    const link = screen.getByRole("link", { name: "opportunity instructions" });
    expect(link).toHaveAttribute("href", path);
  });

  it("renders the conditional description without a link when competition instructions are missing", () => {
    render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath=""
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "opportunity instructions" }),
    ).not.toBeInTheDocument();
  });

  it("shows a validation error in the conditional form row when errors include the application_form_id", () => {
    const conditionalAppFormId = applicationForms[1].application_form_id;

    const errors: FormValidationWarning[] = [
      {
        field: "$",
        message: "some message",
        type: "required",
        value: conditionalAppFormId,
      },
    ];

    render(
      <ApplicationFormsTable
        competitionInstructionsDownloadPath="http://path-to-instructions.com"
        forms={competitionForms}
        applicationForms={applicationForms}
        applicationId={applicationId}
        errors={errors}
      />,
    );

    // Scope to the DEF row so we avoid multiple matches across the page
    const defRow = screen
      .getByRole("link", { name: "DEF Project Form" })
      .closest("tr");
    expect(defRow).not.toBeNull();

    expect(
      within(defRow as HTMLTableRowElement).getByText(
        "Some issues found. Check your entries.",
      ),
    ).toBeInTheDocument();
  });
});
