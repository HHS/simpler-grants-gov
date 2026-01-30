import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import {
  ApplicationDetail,
  ApplicationHistory,
} from "src/types/applicationResponseTypes";
import { Attachment } from "src/types/attachmentTypes";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";
import { mockApplicationSubmission } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import applicationMock from "stories/components/application/application.mock.json";
import historyMock from "stories/components/application/history.mock.json";
import opportunityMock from "stories/components/application/opportunity.mock.json";

import ApplicationContainer from "src/components/application/ApplicationContainer";

// Mock dependencies
const mockRefresh = jest.fn();
const mockPush = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock("src/services/auth/useUser", () => ({
  useUser: () => ({
    user: {
      token: "mock-token",
      email: "test@example.com",
      user_id: "test-user-id",
    },
  }),
}));

// Mock the components that have dependencies on jose/session
jest.mock("src/components/application/attachments/AttachmentsCard", () => ({
  AttachmentsCard: () => <div data-testid="attachments-card">Attachments</div>,
}));

jest.mock("src/components/application/ApplicationFormsTable", () => ({
  ApplicationFormsTable: () => <div data-testid="forms-table">Forms Table</div>,
}));

jest.mock("src/components/application/OpportunityCard", () => ({
  OpportunityCard: () => <div data-testid="opportunity-card">Opportunity</div>,
}));

jest.mock("src/components/application/ApplicationValidationAlert", () => ({
  __esModule: true,
  default: () => <div data-testid="validation-alert">Validation</div>,
}));

// Mock InformationCard to test props
jest.mock("src/components/application/InformationCard", () => ({
  InformationCard: jest.fn(
    ({
      applicationSubmitted,
      applicationSubmitHandler,
      submissionLoading,
    }: {
      applicationSubmitted: boolean;
      applicationSubmitHandler: () => void;
      submissionLoading: boolean;
    }) => (
      <div data-testid="information-card">
        <div data-testid="application-submitted">
          {String(applicationSubmitted)}
        </div>
        <button
          onClick={applicationSubmitHandler}
          disabled={submissionLoading}
          data-testid="mock-submit-button"
        >
          {submissionLoading ? "Loading" : "Submit"}
        </button>
      </div>
    ),
  ),
}));

// Mock the fetch for submitApplication
global.fetch = jest.fn();

const mockApplicationDetails = applicationMock as unknown as ApplicationDetail;
const mockOpportunity = opportunityMock as unknown as OpportunityDetail;
const mockAttachments: Attachment[] = [];

describe("ApplicationContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(jest.fn());
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: {} }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should not have accessibility violations", async () => {
    const { container } = render(
      <ApplicationContainer
        applicationDetails={mockApplicationDetails}
        attachments={mockAttachments}
        opportunity={mockOpportunity}
        applicationHistory={historyMock as ApplicationHistory[]}
        latestApplicationSubmission={mockApplicationSubmission}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("Submit button visibility", () => {
    it("should pass applicationSubmitted=false when application status is 'in_progress'", () => {
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "in_progress",
      };

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submittedStatus = screen.getByTestId("application-submitted");
      expect(submittedStatus).toHaveTextContent("false");
    });

    it("should pass applicationSubmitted=true when application status is 'submitted'", () => {
      const submittedApplication = {
        ...mockApplicationDetails,
        application_status: "submitted",
      };

      render(
        <ApplicationContainer
          applicationDetails={submittedApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submittedStatus = screen.getByTestId("application-submitted");
      expect(submittedStatus).toHaveTextContent("true");
    });

    it("should pass applicationSubmitted=true when application status is 'accepted'", () => {
      const acceptedApplication = {
        ...mockApplicationDetails,
        application_status: "accepted",
      };

      render(
        <ApplicationContainer
          applicationDetails={acceptedApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submittedStatus = screen.getByTestId("application-submitted");
      expect(submittedStatus).toHaveTextContent("true");
    });
  });

  describe("Application History visibility", () => {
    it("should have a history section", () => {
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "in_progress",
      };

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const historyHeader = screen.getByText("applicationHistory");
      expect(historyHeader).toBeInTheDocument();
    });
  });

  describe("Submit application functionality", () => {
    it("should pass applicationSubmitted=true after successful submission", async () => {
      const user = userEvent.setup();
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "in_progress",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      });

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submittedStatus = screen.getByTestId("application-submitted");
      expect(submittedStatus).toHaveTextContent("false");

      const submitButton = screen.getByTestId("mock-submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(submittedStatus).toHaveTextContent("true");
      });
    });

    it("should show success alert after successful submission", async () => {
      const user = userEvent.setup();
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "in_progress",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      });

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submitButton = screen.getByTestId("mock-submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /submissionSuccess/i }),
        ).toBeInTheDocument();
      });
    });

    it("should call router.refresh() after successful submission", async () => {
      const user = userEvent.setup();
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "in_progress",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      });

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submitButton = screen.getByTestId("mock-submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it("should pass submissionLoading=true while submission is in progress", async () => {
      const user = userEvent.setup();
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "in_progress",
      };

      // Create a promise that we can control
      let resolveSubmit: ((value: unknown) => void) | undefined;
      const submitPromise = new Promise((resolve) => {
        resolveSubmit = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(submitPromise);

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submitButton = screen.getByTestId("mock-submit-button");
      expect(submitButton).toHaveTextContent("Submit");
      expect(submitButton).toBeEnabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveTextContent("Loading");
      });

      expect(submitButton).toBeDisabled();

      // Resolve the submission
      if (resolveSubmit) {
        resolveSubmit({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: {} }),
        });
      }

      await waitFor(() => {
        expect(submitButton).toHaveTextContent("Submit");
      });
    });

    it("should display the submission successful box", () => {
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "submitted",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      });

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submitConfirmationtButton = screen.getByText(
        "submissionSuccess.title",
      );
      expect(submitConfirmationtButton).toBeInTheDocument();
    });

    it("should not display the submission successful box when in progress", () => {
      const inProgressApplication = {
        ...mockApplicationDetails,
        application_status: "in_progress",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      });

      render(
        <ApplicationContainer
          applicationDetails={inProgressApplication}
          attachments={mockAttachments}
          opportunity={mockOpportunity}
          applicationHistory={historyMock as ApplicationHistory[]}
          latestApplicationSubmission={mockApplicationSubmission}
        />,
      );

      const submitConfirmationtButton = screen.queryByText(
        "submissionSuccess.title",
      );
      expect(submitConfirmationtButton).not.toBeInTheDocument();
    });
  });
});
