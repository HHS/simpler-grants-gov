import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { SubmissionSetUp } from "./SubmissionSetUp";

describe("SubmissionSetUp", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the section header and subheader", () => {
      render(<SubmissionSetUp />);

      expect(
        screen.getByRole("heading", { name: "header" }),
      ).toBeInTheDocument();
      expect(screen.getByText("subHeader")).toBeInTheDocument();
    });

    it("renders the public competition ID field with correct label and help text", () => {
      render(<SubmissionSetUp />);

      expect(screen.getByText("publicCompetitionId")).toBeInTheDocument();
      expect(screen.getByText("publicCompetitionIdHint")).toBeInTheDocument();
    });

    it("renders the competition title field with correct label and help text", () => {
      render(<SubmissionSetUp />);

      expect(screen.getByText("competitionTitle")).toBeInTheDocument();
      expect(screen.getByText("competitionTitleHint")).toBeInTheDocument();
    });

    it("renders the applicant selection field with correct label and help text", () => {
      render(<SubmissionSetUp />);

      expect(screen.getByText("whoCanApply")).toBeInTheDocument();
      expect(screen.getByText("whoCanApplyHint")).toBeInTheDocument();
    });

    it("renders the competition title as required", () => {
      render(<SubmissionSetUp />);

      const titleInput = screen.getByRole("textbox", {
        name: /competitiontitle/i,
      });
      expect(titleInput).toHaveAccessibleName("competitionTitle *");
    });

    it("renders who can apply as required", () => {
      render(<SubmissionSetUp />);

      const applicantSelect = screen.getByRole("combobox", {
        name: /whocanapply/i,
      });
      expect(applicantSelect).toHaveAccessibleName("whoCanApply *");
    });

    it("renders the selection options", () => {
      render(<SubmissionSetUp />);

      expect(
        screen.getByRole("option", { name: "whoCanApplyOrganizationsOnly" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "whoCanApplyIndividualsOnly" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "whoCanApplyBoth" }),
      ).toBeInTheDocument();
    });

    it("disables all fields when readOnly is true", () => {
      render(<SubmissionSetUp readOnly />);

      expect(
        screen.getByRole("textbox", { name: /publiccompetitionid/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole("textbox", { name: /competitiontitle/i }),
      ).toBeDisabled();
      expect(
        screen.getByRole("combobox", { name: /whocanapply/i }),
      ).toBeDisabled();
    });
  });

  describe("field values", () => {
    it("populates form fields from the provided values", () => {
      render(
        <SubmissionSetUp
          publicCompetitionId="COMP-123"
          competitionTitle="Test Competition"
          openToApplicants={["organization", "individual"]}
        />,
      );

      expect(
        screen.getByRole("textbox", { name: /publiccompetitionid/i }),
      ).toHaveValue("COMP-123");
      expect(
        screen.getByRole("textbox", { name: /competitiontitle/i }),
      ).toHaveValue("Test Competition");
      expect(
        screen.getByRole("combobox", { name: /whocanapply/i }),
      ).toHaveValue("both");
    });

    it("maps a single organization type to the corresponding select value", () => {
      render(<SubmissionSetUp openToApplicants={["organization"]} />);

      expect(
        screen.getByRole("combobox", { name: /whocanapply/i }),
      ).toHaveValue("organizations_only");
    });

    it("maps a single individual type to the corresponding select value", () => {
      render(<SubmissionSetUp openToApplicants={["individual"]} />);

      expect(
        screen.getByRole("combobox", { name: /whocanapply/i }),
      ).toHaveValue("individuals_only");
    });
  });

  describe("accessibility", () => {
    it("passes accessibility scan when rendered", async () => {
      const { container } = render(<SubmissionSetUp />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
