import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import { createRiskAction } from "src/app/[locale]/(base)/award-recommendation/[id]/risks/actions";

import AddRiskForm from "./AddRiskForm";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock(
  "src/app/[locale]/(base)/award-recommendation/[id]/risks/actions",
  () => ({
    createRiskAction: jest.fn(),
  }),
);

const mockSelectedSubmissions = [
  {
    award_recommendation_application_submission_id: "sub-1",
    application_submission: {
      application_submission_id: "app-1",
      application_submission_number: "APP-001",
      project_title: "Test Project",
      total_requested_amount: "100000.00",
      application: {
        application_id: "app-id-1",
        competition_id: "comp-1",
        organization: {
          organization_id: "org-1",
          organization_name: "Test Organization",
          uei: "UEI123456",
        },
      },
    },
    submission_detail: {
      award_recommendation_type: "recommended_for_funding",
      recommended_amount: "75000.00",
      has_exception: false,
    },
  },
];

jest.mock("src/hooks/useSelectedSubmissions", () => ({
  useSelectedSubmissions: () => ({
    selectedSubmissions: mockSelectedSubmissions,
    hasSelections: true,
  }),
}));

jest.mock("src/components/core/TableWithResponsiveHeader", () => ({
  TableWithResponsiveHeader: ({
    headerContent,
    tableRowData,
  }: {
    headerContent: Array<{ cellData: React.ReactNode }>;
    tableRowData: Array<Array<{ cellData: React.ReactNode }>>;
  }) => (
    <table data-testid="responsive-table">
      <thead>
        <tr>
          {headerContent.map((header, i) => (
            <th key={i}>{header.cellData}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableRowData.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell.cellData}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

describe("AddRiskForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders table with selected submissions", () => {
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    expect(screen.getByText("selectedApplications")).toBeInTheDocument();
    expect(screen.getByText("APP-001")).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Test Organization")).toBeInTheDocument();
    expect(screen.getByText("UEI123456")).toBeInTheDocument();
  });

  it("renders risk details form fields", () => {
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    expect(screen.getByText("riskDetailsHeading")).toBeInTheDocument();
    expect(screen.getByLabelText(/riskSummaryLabel/)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/recommendedConditionLabel/),
    ).toBeInTheDocument();
  });

  it("allows user to enter risk summary", async () => {
    const user = userEvent.setup();
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const textarea = screen.getByLabelText(/riskSummaryLabel/);
    await user.type(textarea, "Test risk summary");

    await waitFor(() => {
      expect(textarea).toHaveValue("Test risk summary");
    });
  });

  it("allows user to select a condition", async () => {
    const user = userEvent.setup();
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const select = screen.getByLabelText(/recommendedConditionLabel/);
    await user.selectOptions(select, "condition1");

    await waitFor(() => {
      expect(select).toHaveValue("condition1");
    });
  });

  it("renders cancel and save buttons", () => {
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    expect(screen.getByText("cancelButton")).toBeInTheDocument();
    expect(screen.getByText("saveButton")).toBeInTheDocument();
  });

  it("displays recommended tag for recommended submissions", () => {
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const tag = screen.getByText("recommendationType.recommended_for_funding");
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveClass("bg-info-lighter");
  });

  it("formats currency amounts correctly", () => {
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("$75,000")).toBeInTheDocument();
  });

  it("renders links to submission details", () => {
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const link = screen.getByRole("link", { name: "APP-001" });
    expect(link).toHaveAttribute(
      "href",
      "/award-recommendation/test-award-id/application-submissions/sub-1/edit",
    );
  });

  it("shows validation error when trying to save without required fields", async () => {
    const user = userEvent.setup();
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const saveButton = screen.getByText("saveButton");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("validationError")).toBeInTheDocument();
    });

    expect(createRiskAction).not.toHaveBeenCalled();
  });

  it("calls createRiskAction with correct data on save", async () => {
    const user = userEvent.setup();
    (createRiskAction as jest.Mock).mockResolvedValue({
      success: true,
      riskId: "risk-123",
    });

    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const textarea = screen.getByLabelText(/riskSummaryLabel/);
    await user.type(textarea, "Test risk summary");

    const select = screen.getByLabelText(/recommendedConditionLabel/);
    await user.selectOptions(select, "condition1");

    const saveButton = screen.getByText("saveButton");
    await user.click(saveButton);

    await waitFor(() => {
      expect(createRiskAction).toHaveBeenCalledWith("test-award-id", {
        comment: "Test risk summary",
        award_recommendation_risk_type: "additional_monitoring",
        award_recommendation_application_submission_ids: ["sub-1"],
      });
    });
  });

  it("redirects to edit page on successful save", async () => {
    const user = userEvent.setup();
    (createRiskAction as jest.Mock).mockResolvedValue({
      success: true,
      riskId: "risk-123",
    });

    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const textarea = screen.getByLabelText(/riskSummaryLabel/);
    await user.type(textarea, "Test risk summary");

    const select = screen.getByLabelText(/recommendedConditionLabel/);
    await user.selectOptions(select, "condition1");

    const saveButton = screen.getByText("saveButton");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/award-recommendation/test-award-id/edit",
      );
    });
  });

  it("displays error message when save fails", async () => {
    const user = userEvent.setup();
    (createRiskAction as jest.Mock).mockResolvedValue({
      success: false,
      errorMessage: "Failed to create risk",
    });

    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const textarea = screen.getByLabelText(/riskSummaryLabel/);
    await user.type(textarea, "Test risk summary");

    const select = screen.getByLabelText(/recommendedConditionLabel/);
    await user.selectOptions(select, "condition1");

    const saveButton = screen.getByText("saveButton");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to create risk")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables buttons while submitting", async () => {
    const user = userEvent.setup();
    (createRiskAction as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, riskId: "risk-123" }), 100),
        ),
    );

    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const textarea = screen.getByLabelText(/riskSummaryLabel/);
    await user.type(textarea, "Test risk summary");

    const select = screen.getByLabelText(/recommendedConditionLabel/);
    await user.selectOptions(select, "condition1");

    const saveButton = screen.getByText("saveButton");
    const cancelButton = screen.getByText("cancelButton");

    await user.click(saveButton);

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByText("savingButton")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("navigates to edit page when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const cancelButton = screen.getByText("cancelButton");
    await user.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith(
      "/award-recommendation/test-award-id/edit",
    );
  });

  it("allows dismissing error alert", async () => {
    const user = userEvent.setup();
    (createRiskAction as jest.Mock).mockResolvedValue({
      success: false,
      errorMessage: "Failed to create risk",
    });

    render(<AddRiskForm awardRecommendationId="test-award-id" />);

    const textarea = screen.getByLabelText(/riskSummaryLabel/);
    await user.type(textarea, "Test risk summary");

    const select = screen.getByLabelText(/recommendedConditionLabel/);
    await user.selectOptions(select, "condition1");

    const saveButton = screen.getByText("saveButton");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to create risk")).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId("simpler-alert-close-button");
    await user.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Failed to create risk"),
      ).not.toBeInTheDocument();
    });
  });
});
