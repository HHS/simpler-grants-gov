import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";

import EditRecommendationsTable from "./EditRecommendationsTable";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("@trussworks/react-uswds", () => ({
  ...jest.requireActual<typeof import("@trussworks/react-uswds")>(
    "@trussworks/react-uswds",
  ),
  Pagination: ({
    currentPage,
    totalPages,
    onClickNext,
    onClickPrevious,
  }: {
    currentPage: number;
    totalPages: number;
    onClickNext: () => void;
    onClickPrevious: () => void;
  }) => (
    <div data-testid="pagination">
      <button onClick={onClickPrevious} disabled={currentPage === 1}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={onClickNext} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  ),
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

jest.mock("src/utils/formatCurrencyUtil", () => ({
  formatCurrencyString: (value?: string) => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `$${num.toLocaleString("en-US")}`;
  },
}));

const mockSubmissions = [
  {
    award_recommendation_application_submission_id: "sub-1",
    application_submission: {
      application_submission_id: "app-1",
      application_submission_number: "APP-001",
      project_title: "Project Alpha",
      total_requested_amount: "100000",
      application: {
        organization: {
          organization_name: "Org Alpha",
          uei: "UEI123456",
        },
      },
    },
    submission_detail: {
      recommended_amount: "50000",
      scoring_comment: "85",
    },
  },
  {
    award_recommendation_application_submission_id: "sub-2",
    application_submission: {
      application_submission_id: "app-2",
      application_submission_number: "APP-002",
      project_title: "Project Beta",
      total_requested_amount: "75000",
      application: {
        organization: {
          organization_name: "Org Beta",
          uei: "UEI789012",
        },
      },
    },
    submission_detail: {
      recommended_amount: "0",
      scoring_comment: "60",
    },
  },
];

const mockClientFetch = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: mockClientFetch,
  }),
}));

let mockSelectedSubmissionIds = new Set<string>();
let mockSelectedSubmissions: typeof mockSubmissions = [];

const mockAddSubmission = jest.fn(
  (submission: (typeof mockSubmissions)[number]) => {
    mockSelectedSubmissionIds.add(
      submission.award_recommendation_application_submission_id,
    );
    mockSelectedSubmissions.push(submission);
  },
);

const mockAddMultipleSubmissions = jest.fn(
  (submissions: typeof mockSubmissions) => {
    submissions.forEach((submission) => {
      mockSelectedSubmissionIds.add(
        submission.award_recommendation_application_submission_id,
      );
      mockSelectedSubmissions.push(submission);
    });
  },
);

const mockRemoveSubmission = jest.fn((id: string) => {
  mockSelectedSubmissionIds.delete(id);
  mockSelectedSubmissions = mockSelectedSubmissions.filter(
    (s) => s.award_recommendation_application_submission_id !== id,
  );
});

const mockSetSelectedSubmissionIds = jest.fn((ids: Set<string>) => {
  mockSelectedSubmissionIds = ids;
});

const mockClearSelections = jest.fn(() => {
  mockSelectedSubmissionIds = new Set();
  mockSelectedSubmissions = [];
});

jest.mock("src/hooks/useSelectedSubmissions", () => ({
  useSelectedSubmissions: () => ({
    get selectedSubmissionIds() {
      return mockSelectedSubmissionIds;
    },
    get selectedSubmissions() {
      return mockSelectedSubmissions;
    },
    get hasSelections() {
      return mockSelectedSubmissionIds.size > 0;
    },
    setSelectedSubmissionIds: mockSetSelectedSubmissionIds,
    addSubmission: mockAddSubmission,
    addMultipleSubmissions: mockAddMultipleSubmissions,
    removeSubmission: mockRemoveSubmission,
    clearSelections: mockClearSelections,
  }),
}));

describe("EditRecommendationsTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedSubmissionIds = new Set();
    mockSelectedSubmissions = [];
    mockClientFetch.mockResolvedValue({
      data: mockSubmissions,
      pagination_info: {
        total_pages: 1,
        total_records: 2,
      },
    });
  });

  it("renders table with submissions", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      expect(screen.getByText("APP-002")).toBeInTheDocument();
      expect(screen.getByText("Project Beta")).toBeInTheDocument();
    });
  });

  it("renders all table columns correctly", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    expect(screen.getByText("columns.appNumber")).toBeInTheDocument();
    expect(screen.getByText("columns.projectTitle")).toBeInTheDocument();
    expect(screen.getByText("columns.orgName")).toBeInTheDocument();
    expect(screen.getByText("columns.uei")).toBeInTheDocument();
    expect(screen.getByText("columns.score")).toBeInTheDocument();
    expect(screen.getByText("columns.recommendation")).toBeInTheDocument();
    expect(screen.getByText("columns.requested")).toBeInTheDocument();
    expect(screen.getByText("columns.recommended")).toBeInTheDocument();
  });

  it("displays organization details correctly", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("Org Alpha")).toBeInTheDocument();
      expect(screen.getByText("UEI123456")).toBeInTheDocument();
      expect(screen.getByText("Org Beta")).toBeInTheDocument();
      expect(screen.getByText("UEI789012")).toBeInTheDocument();
    });
  });

  it("formats currency amounts correctly", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("$75,000")).toBeInTheDocument();
    expect(screen.getByText("$50,000")).toBeInTheDocument();
  });

  it("displays scoring comments correctly", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("displays None badge for all recommendation columns", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const noneBadges = screen.getAllByText("none");
    expect(noneBadges.length).toBe(2);

    // Verify badge styling
    noneBadges.forEach((badge) => {
      expect(badge).toHaveClass("usa-tag");
      expect(badge).toHaveClass("bg-base-lighter");
      expect(badge).toHaveClass("text-no-wrap");
    });
  });

  it("allows selecting individual rows", async () => {
    const user = userEvent.setup();
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    const firstRowCheckbox = checkboxes[1];

    await user.click(firstRowCheckbox);

    await waitFor(() => {
      expect(mockAddSubmission).toHaveBeenCalledWith(mockSubmissions[0]);
    });
  });

  it("allows selecting all rows on current page", async () => {
    const user = userEvent.setup();
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];

    await user.click(selectAllCheckbox);

    await waitFor(() => {
      expect(mockAddMultipleSubmissions).toHaveBeenCalledTimes(1);
    });
    expect(mockAddMultipleSubmissions).toHaveBeenCalledWith(mockSubmissions);
  });

  it("allows deselecting all rows", async () => {
    const user = userEvent.setup();
    mockSelectedSubmissionIds = new Set(["sub-1", "sub-2"]);
    mockSelectedSubmissions = [...mockSubmissions];

    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];

    await user.click(selectAllCheckbox);

    await waitFor(() => {
      expect(mockSetSelectedSubmissionIds).toHaveBeenCalled();
      const callArg = mockSetSelectedSubmissionIds.mock.calls[0][0];
      expect(callArg.size).toBe(0);
    });
  });

  it("handles API errors gracefully", async () => {
    mockClientFetch.mockRejectedValue(new Error("API Error"));
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("errorLoading")).toBeInTheDocument();
    });
  });

  it("calls clientFetch with correct parameters", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(mockClientFetch).toHaveBeenCalledWith(
        "/api/award-recommendations/test-award-id/submissions/list",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  });

  it("renders application numbers as links", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "APP-001" })).toBeInTheDocument();
    });
    const link = screen.getByRole("link", { name: "APP-001" });
    expect(link).toHaveAttribute(
      "href",
      "/award-recommendation/test-award-id/application-submissions/sub-1/edit",
    );
  });

  it("applies teal checkbox styling class", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveClass("edit-recommendations-table-checkbox");
    });
  });

  it("shows indeterminate checkbox when only some rows are selected", async () => {
    mockSelectedSubmissionIds = new Set(["sub-1"]);
    mockSelectedSubmissions = [mockSubmissions[0]];

    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const headerCheckbox = screen.getAllByRole(
      "checkbox",
    )[0] as HTMLInputElement;

    expect(headerCheckbox).not.toBeChecked();
    expect(headerCheckbox.indeterminate).toBe(true);
  });

  it("renders Pagination component when multiple pages exist", async () => {
    mockClientFetch.mockResolvedValue({
      data: mockSubmissions,
      pagination_info: {
        total_pages: 3,
        total_records: 150,
      },
    });

    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });
  });

  it("does not render Pagination when only one page exists", async () => {
    mockClientFetch.mockResolvedValue({
      data: mockSubmissions,
      pagination_info: {
        total_pages: 1,
        total_records: 2,
      },
    });

    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  it("shows banner with showing range and selection count", async () => {
    mockSelectedSubmissionIds = new Set(["sub-1"]);
    mockSelectedSubmissions = [mockSubmissions[0]];

    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    expect(screen.getByText("showingRange")).toBeInTheDocument();
    expect(screen.getByText("selectedCount")).toBeInTheDocument();
  });

  it("shows Edit button when selections exist", async () => {
    mockSelectedSubmissionIds = new Set(["sub-1"]);
    mockSelectedSubmissions = [mockSubmissions[0]];

    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: "editButton" });
    expect(editButton).toBeInTheDocument();
  });

  it("hides Edit button when no selections", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    expect(screen.getByText("showingRange")).toBeInTheDocument();
    expect(screen.queryByText("selectedCount")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "editButton" }),
    ).not.toBeInTheDocument();
  });

  it("uses TableWithResponsiveHeader component", async () => {
    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByTestId("responsive-table")).toBeInTheDocument();
    });
  });

  it("displays em dash for missing organization data", async () => {
    const submissionsWithMissingData = [
      {
        award_recommendation_application_submission_id: "sub-3",
        application_submission: {
          application_submission_id: "app-3",
          application_submission_number: "APP-003",
          project_title: "Project Gamma",
        },
        submission_detail: {},
      },
    ];

    mockClientFetch.mockResolvedValue({
      data: submissionsWithMissingData,
      pagination_info: {
        total_pages: 1,
        total_records: 1,
      },
    });

    render(<EditRecommendationsTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-003")).toBeInTheDocument();
    });

    const emDashes = screen.getAllByText("—");
    expect(emDashes.length).toBeGreaterThan(0);
  });
});
