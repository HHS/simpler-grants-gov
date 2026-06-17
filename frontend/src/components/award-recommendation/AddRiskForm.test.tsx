import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";

import AddRiskForm from "./AddRiskForm";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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
});
