import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApplicationDetail, Status } from "src/types/applicationResponseTypes";
import { Competition } from "src/types/competitionsResponseTypes";
import { mockApplicationSubmission } from "src/utils/testing/fixtures";
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

function makeApplicationDetails(
  overrides: Omit<Partial<ApplicationDetail>, "competition"> & {
    competition?: Partial<Competition>;
  } = {},
): ApplicationDetail {
  const competition: Competition = {
    ...mockApplicationDetails.competition,
    ...(overrides.competition ?? {}),
  };

  return {
    ...mockApplicationDetails,
    ...overrides,
    competition,
  };
}

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
    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={makeApplicationDetails({
          application_status: Status.IN_PROGRESS,
        })}
      />,
    );

    expect(screen.getByText("buttonText")).toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is submitted", () => {
    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={makeApplicationDetails({
          application_status: Status.SUBMITTED,
        })}
      />,
    );

    expect(screen.queryByText("buttonText")).not.toBeInTheDocument();
  });

  it("hides Edit filing name button when application status is accepted", () => {
    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={makeApplicationDetails({
          application_status: Status.ACCEPTED,
        })}
      />,
    );

    expect(screen.queryByText("buttonText")).not.toBeInTheDocument();
  });
});

describe("InformationCard - Special instructions when Submitted", () => {
  const defaultProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
    latestApplicationSubmission: mockApplicationSubmission,
  };

  it("shows special instructions when competition is set to (is_open=false)", () => {
    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={makeApplicationDetails({
          competition: { is_open: false },
        })}
      />,
    );

    expect(screen.getByText("specialInstructions")).toBeInTheDocument();
  });

  it("hides special instructions when competition is set to (is_open=true)", () => {
    render(
      <InformationCard
        {...defaultProps}
        applicationDetails={makeApplicationDetails({
          competition: { is_open: true },
        })}
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
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          competition: { is_open: true },
        })}
      />,
    );

    expect(screen.getByText("submit")).toBeInTheDocument();
  });

  it("hides submit when is_open=false", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          competition: { is_open: false },
        })}
      />,
    );

    expect(screen.queryByText("submit")).not.toBeInTheDocument();
  });

  it("hides submit when applicationSubmitted=true", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationSubmitted={true}
        applicationDetails={makeApplicationDetails({
          competition: { is_open: true },
        })}
      />,
    );

    expect(screen.queryByText("submit")).not.toBeInTheDocument();
  });

  it("disables submit when submissionLoading=true", () => {
    render(
      <InformationCard
        {...baseProps}
        submissionLoading={true}
        applicationDetails={makeApplicationDetails({
          competition: { is_open: true },
        })}
      />,
    );

    expect(screen.getByRole("button", { name: /loading/i })).toBeDisabled();
  });
});

describe("InformationCard - Transfer ownership UI", () => {
  const baseProps = {
    applicationDetails: mockApplicationDetails,
    applicationSubmitHandler: jest.fn(),
    applicationSubmitted: false,
    opportunityName: "Test Opportunity",
    submissionLoading: false,
    instructionsDownloadPath: "http://path-to-instructions.com",
    latestApplicationSubmission: mockApplicationSubmission,
  };

  it("shows the transfer ownership button when: no org + competition allows orgs + application is editable (in_progress)", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          organization: null,
          application_status: Status.IN_PROGRESS,
          competition: { open_to_applicants: ["organization"] },
        })}
      />,
    );

    expect(screen.getByTestId("transfer-ownership-open")).toBeInTheDocument();
  });

  it("does not show transfer ownership button when application is submitted", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          organization: null,
          application_status: Status.SUBMITTED,
          competition: { open_to_applicants: ["organization"] },
        })}
      />,
    );

    expect(
      screen.queryByTestId("transfer-ownership-open"),
    ).not.toBeInTheDocument();
  });

  it("does not show transfer ownership button when application is accepted", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          organization: null,
          application_status: Status.ACCEPTED,
          competition: { open_to_applicants: ["organization"] },
        })}
      />,
    );

    expect(
      screen.queryByTestId("transfer-ownership-open"),
    ).not.toBeInTheDocument();
  });

  it("does not show the transfer ownership button when the application has no organization but the competition does NOT allow organizations", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          organization: null,
          application_status: Status.IN_PROGRESS,
          competition: { open_to_applicants: ["individual"] },
        })}
      />,
    );

    expect(
      screen.queryByTestId("transfer-ownership-open"),
    ).not.toBeInTheDocument();
  });

  it("opens the transfer modal when clicking the transfer ownership button and closes it via onAfterClose", async () => {
    const user = userEvent.setup();

    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          organization: null,
          application_status: Status.IN_PROGRESS,
          competition: { open_to_applicants: ["organization"] },
        })}
      />,
    );

    await user.click(screen.getByTestId("transfer-ownership-open"));
    expect(screen.getByTestId("transfer-ownership-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(
      screen.queryByTestId("transfer-ownership-modal"),
    ).not.toBeInTheDocument();
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
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          application_status: Status.ACCEPTED,
        })}
      />,
    );

    expect(screen.queryByTestId(submissionButtonTestId)).toBeInTheDocument();
    expect(
      screen.queryByTestId(submissionMessageTestId),
    ).not.toBeInTheDocument();
  });

  it("shows download processing message if in submitted status", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          application_status: Status.SUBMITTED,
        })}
      />,
    );

    expect(
      screen.queryByTestId(submissionButtonTestId),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId(submissionMessageTestId)).toBeInTheDocument();
  });

  it("does not render download submission section if application is in in_progress status", () => {
    render(
      <InformationCard
        {...baseProps}
        applicationDetails={makeApplicationDetails({
          application_status: Status.IN_PROGRESS,
        })}
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
