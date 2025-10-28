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

  it("shows the message when the competition is OPEN (is_open=true)", () => {
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

    expect(screen.getByText("specialInstructions")).toBeInTheDocument();
  });

  it("hides the message when the competition is CLOSED (is_open=false)", () => {
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

    expect(screen.queryByText("specialInstructions")).not.toBeInTheDocument();
  });
});
