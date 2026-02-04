import { render, screen } from "@testing-library/react";
import { ApplicationDetail, Status } from "src/types/applicationResponseTypes";
import { mockApplicationSubmission } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import applicationMock from "stories/components/application/application.mock.json";

import React from "react";

import { InformationCard } from "src/components/application/InformationCard";

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

    translationFunction.rich = (
      key: string,
      values: Record<string, (chunks: React.ReactNode) => React.ReactNode>,
    ) => {
      if (key === "unassociatedApplicationAlert.body") {
        const linkRenderer = values.link;
        if (!linkRenderer) {
          return key;
        }

        return (
          <>
            {"You can continue working... "}
            {linkRenderer("Click here to transfer application ownership")}
            {"."}
          </>
        );
      }

      return key;
    };

    return translationFunction;
  },
}));

jest.mock(
  "src/components/application/editAppFilingName/EditAppFilingName",
  () => ({
    EditAppFilingName: () => <button>buttonText</button>,
  }),
);

jest.mock("src/components/USWDSIcon", () => ({
  USWDSIcon: () => <span aria-hidden="true" />,
}));

jest.mock("src/components/InlineActionLink", () => ({
  InlineActionLink: ({
    onClick,
    children,
  }: {
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock(
  "src/components/application/transferOwnership/TransferOwnershipModal",
  () => ({
    TransferOwnershipModal: ({
      onAfterClose,
    }: {
      onAfterClose: () => void;
    }) => (
      <div data-testid="transfer-ownership-modal">
        <button type="button" onClick={onAfterClose}>
          Close
        </button>
      </div>
    ),
  }),
);

jest.mock(
  "src/components/application/transferOwnership/TransferOwnershipButton",
  () => ({
    TransferOwnershipButton: ({ onClick }: { onClick: () => void }) => (
      <button
        type="button"
        data-testid="transfer-ownership-open"
        onClick={onClick}
      >
        Open transfer
      </button>
    ),
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
    latestApplicationSubmission: mockApplicationSubmission,
  };

  it("shows Edit filing name button when application status is in_progress", () => {
    const inProgressApplication: ApplicationDetail = {
      ...mockApplicationDetails,
      application_status: Status.IN_PROGRESS,
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={inProgressApplication}
      />,
    );

    expect(screen.getByText("buttonText")).toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is submitted", () => {
    const submittedApplication: ApplicationDetail = {
      ...mockApplicationDetails,
      application_status: Status.SUBMITTED,
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={submittedApplication}
      />,
    );

    expect(screen.queryByText("buttonText")).not.toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is accepted", () => {
    const acceptedApplication: ApplicationDetail = {
      ...mockApplicationDetails,
      application_status: Status.ACCEPTED,
    };

    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={acceptedApplication}
      />,
    );

    expect(screen.queryByText("buttonText")).not.toBeInTheDocument();
  });
});

describe("InformationCard - Special instructions when closed", () => {
  const defaultProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
    latestApplicationSubmission: mockApplicationSubmission,
  };

  it("shows special instructions when competition is CLOSED (is_open=false)", () => {
    const closedApplication: ApplicationDetail = {
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

    expect(screen.getByText("specialInstructions")).toBeInTheDocument();
  });

  it("hides special instructions when competition is OPEN (is_open=true)", () => {
    const openApplication: ApplicationDetail = {
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

describe("InformationCard - Submit button", () => {
  const baseProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
    latestApplicationSubmission: mockApplicationSubmission,
  };

  it("shows submit when is_open=true and not submitted", () => {
    const openApplication: ApplicationDetail = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard {...baseProps} applicationDetails={openApplication} />,
    );

    expect(screen.getByText("submit")).toBeInTheDocument();
  });

  it("hides submit when is_open=false", () => {
    const closedApplication: ApplicationDetail = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: false },
    };

    render(
      <InformationCard {...baseProps} applicationDetails={closedApplication} />,
    );

    expect(screen.queryByText("submit")).not.toBeInTheDocument();
  });

  it("hides submit when applicationSubmitted=true", () => {
    const openApplication: ApplicationDetail = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard
        {...baseProps}
        applicationSubmitted={true}
        applicationDetails={openApplication}
      />,
    );

    expect(screen.queryByText("submit")).not.toBeInTheDocument();
  });

  it("disables submit when submissionLoading=true", () => {
    const openApplication: ApplicationDetail = {
      ...mockApplicationDetails,
      competition: { ...mockApplicationDetails.competition, is_open: true },
    };

    render(
      <InformationCard
        {...baseProps}
        submissionLoading={true}
        applicationDetails={openApplication}
      />,
    );

    // Button shows “Loading...” when isSubmitting
    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
  });
});

describe("InformationCard - org-only eligibility", () => {
  const baseProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
  };

  it("shows warning alert and disables submit when competition is org-only and application has no org", () => {
    const orgOnlyNoOrg: ApplicationDetail = {
      ...mockApplicationDetails,
      organization: null,
      competition: {
        ...mockApplicationDetails.competition,
        is_open: true,
        open_to_applicants: ["organization"],
      },
    };

    render(
      <InformationCard {...baseProps} applicationDetails={orgOnlyNoOrg} />,
    );

    expect(
      screen.getByTestId("unassociated-application-alert"),
    ).toBeInTheDocument();

    // submit text is "submit" when not loading
    const submitButton = screen.getByRole("button", { name: "submit" });
    expect(submitButton).toBeDisabled();
  });

  it("does not show alert when competition allows individuals (individual+organization) even if application has no org", () => {
    const mixedNoOrg: ApplicationDetail = {
      ...mockApplicationDetails,
      organization: null,
      competition: {
        ...mockApplicationDetails.competition,
        is_open: true,
        open_to_applicants: ["individual", "organization"],
      },
    };

    render(<InformationCard {...baseProps} applicationDetails={mixedNoOrg} />);

    expect(
      screen.queryByTestId("unassociated-application-alert"),
    ).not.toBeInTheDocument();
  });

  it("opens the transfer modal from the alert link", () => {
    const orgOnlyNoOrg: ApplicationDetail = {
      ...mockApplicationDetails,
      organization: null,
      competition: {
        ...mockApplicationDetails.competition,
        is_open: true,
        open_to_applicants: ["organization"],
      },
    };

    render(
      <InformationCard {...baseProps} applicationDetails={orgOnlyNoOrg} />,
    );

    // translation mock returns the key string, but the body uses rich text content
    // so we click by the literal text inside the <link> tag from your locale file:
    // "Click here to transfer application ownership"
    fireEvent.click(
      screen.getByRole("button", {
        name: /Click here to transfer application ownership/i,
      }),
    );

    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();
  });

  it("opens the transfer modal from the transfer ownership button next to applicant type", () => {
    const orgOnlyNoOrg: ApplicationDetail = {
      ...mockApplicationDetails,
      organization: null,
      competition: {
        ...mockApplicationDetails.competition,
        is_open: true,
        open_to_applicants: ["organization"],
      },
    };

    render(
      <InformationCard {...baseProps} applicationDetails={orgOnlyNoOrg} />,
    );

    fireEvent.click(screen.getByTestId("transfer-ownership-open"));

    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();
  });
});

describe("InformationCard - Download submission button visibility and content", () => {
  const submissionButtonTestId = "application-submission-download";
  const submissionMessageTestId = "application-submission-download-message";
  const baseProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
    latestApplicationSubmission: mockApplicationSubmission,
  };

  it("shows the download submission button when status is accepted", () => {
    const acceptedApplication = {
      ...mockApplicationDetails,
      application_status: Status.ACCEPTED,
    };

    render(
      <InformationCard
        {...baseProps}
        applicationDetails={acceptedApplication}
      />,
    );

    expect(screen.queryByTestId(submissionButtonTestId)).toBeInTheDocument();
    expect(
      screen.queryByTestId(submissionMessageTestId),
    ).not.toBeInTheDocument();
  });

  it("shows download processing message if in submitted status", () => {
    const submittedApplication = {
      ...mockApplicationDetails,
      application_status: Status.SUBMITTED,
    };

    render(
      <InformationCard
        {...baseProps}
        applicationDetails={submittedApplication}
      />,
    );

    expect(
      screen.queryByTestId(submissionButtonTestId),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId(submissionMessageTestId)).toBeInTheDocument();
  });

  it("shows does not render if application is in in_progress status", () => {
    const inProgressApplication = {
      ...mockApplicationDetails,
      application_status: Status.IN_PROGRESS,
    };

    render(
      <InformationCard
        {...baseProps}
        applicationDetails={inProgressApplication}
      />,
    );

    expect(
      screen.queryByTestId(submissionButtonTestId),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(submissionMessageTestId),
    ).not.toBeInTheDocument();
  });
});
