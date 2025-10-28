import { render, screen } from "@testing-library/react";
import { ApplicationDetail, Status } from "src/types/applicationResponseTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import applicationMock from "stories/components/application/application.mock.json";

import { InformationCard } from "src/components/application/InformationCard";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock(
  "src/components/application/editAppFilingName/EditAppFilingName",
  () => ({
    EditAppFilingName: () => <button>buttonText</button>,
  }),
);

const mockApplicationDetails = applicationMock as unknown as ApplicationDetail;

describe("InformationCard - Edit filing name button visibility", () => {
  const defaultProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
  };

  it("shows Edit filing name button when application status is in_progress", () => {
    const inProgressApplication = {
      ...mockApplicationDetails,
      application_status: Status.IN_PROGRESS,
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={inProgressApplication}
      />,
    );

    const editButton = screen.getByText("buttonText");
    expect(editButton).toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is submitted", () => {
    const submittedApplication = {
      ...mockApplicationDetails,
      application_status: Status.SUBMITTED,
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={submittedApplication}
      />,
    );

    const editButton = screen.queryByText("buttonText");
    expect(editButton).not.toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is accepted", () => {
    const acceptedApplication = {
      ...mockApplicationDetails,
      application_status: Status.ACCEPTED,
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={acceptedApplication}
      />,
    );

    const editButton = screen.queryByText("buttonText");
    expect(editButton).not.toBeInTheDocument();
  });
});

describe("InformationCard - No longer accepting applications message", () => {
  const defaultProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
  };

  it("shows the message when the competition is CLOSED (is_open=false)", () => {
    const closedApplication = {
      ...mockApplicationDetails,
      competition: {
        ...mockApplicationDetails.competition,
        is_open: false,
      },
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={closedApplication}
      />,
    );

    // useTranslationsMock returns key strings, so we look for the key itself
    expect(screen.getByText("specialInstructions")).toBeInTheDocument();
  });

  it("hides the message when the competition is OPEN (is_open=true)", () => {
    const openApplication = {
      ...mockApplicationDetails,
      competition: {
        ...mockApplicationDetails.competition,
        is_open: true,
      },
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={openApplication}
      />,
    );

    expect(screen.queryByText("specialInstructions")).not.toBeInTheDocument();
  });
});

describe("InformationCard - Submit button visibility", () => {
  const baseProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
  };

  it("shows the Submit button when is_open=true and application not submitted", () => {
    const openNotSubmitted = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard
        {...baseProps}
        applicationDetails={openNotSubmitted}
      />,
    );

    expect(screen.getByText("submit")).toBeInTheDocument();
  });

  it("hides the Submit button when competition is CLOSED (is_open=false)", () => {
    const closed = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: false },
    };

    render(
      <InformationCard
        {...baseProps}
        applicationDetails={closed}
      />,
    );

    expect(screen.queryByText("submit")).not.toBeInTheDocument();
  });

  it("hides the Submit button when application has already been submitted", () => {
    const open = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard
        {...baseProps}
        applicationSubmitted={true}
        applicationDetails={open}
      />,
    );

    expect(screen.queryByText("submit")).not.toBeInTheDocument();
  });

  it("disables the Submit button while submissionLoading=true", () => {
    const open = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard
        {...baseProps}
        submissionLoading={true}
        applicationDetails={open}
      />,
    );

    const btn = screen.getByText(/loading/i).closest("button");
    expect(btn).toBeDisabled();
  });
});