import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";

import RisksTable from "./RisksTable";

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

const mockSubmissions = [
  {
    award_recommendation_application_submission_id: "sub-1",
    application_submission: {
      application_submission_id: "app-1",
      application_submission_number: "APP-001",
      project_title: "Project Alpha",
    },
    submission_detail: {
      award_recommendation_type: "recommended_for_funding",
      recommended_amount: "50000",
    },
  },
  {
    award_recommendation_application_submission_id: "sub-2",
    application_submission: {
      application_submission_id: "app-2",
      application_submission_number: "APP-002",
      project_title: "Project Beta",
    },
    submission_detail: {
      award_recommendation_type: "not_recommended",
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
let mockHasSelections = false;

const mockAddSubmission = jest.fn(
  (submission: (typeof mockSubmissions)[number]) => {
    mockSelectedSubmissionIds.add(
      submission.award_recommendation_application_submission_id,
    );
    mockSelectedSubmissions.push(submission);
    mockHasSelections = true;
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
    mockHasSelections = mockSelectedSubmissionIds.size > 0;
  },
);

const mockRemoveSubmission = jest.fn((id: string) => {
  mockSelectedSubmissionIds.delete(id);
  mockSelectedSubmissions = mockSelectedSubmissions.filter(
    (s) => s.award_recommendation_application_submission_id !== id,
  );
  mockHasSelections = mockSelectedSubmissionIds.size > 0;
});

const mockSetSelectedSubmissionIds = jest.fn((ids: Set<string>) => {
  mockSelectedSubmissionIds = ids;
  mockHasSelections = ids.size > 0;
});

const mockClearSelections = jest.fn(() => {
  mockSelectedSubmissionIds = new Set();
  mockSelectedSubmissions = [];
  mockHasSelections = false;
});

jest.mock("src/hooks/useSelectedSubmissions", () => ({
  useSelectedSubmissions: () => ({
    get selectedSubmissionIds() {
      return mockSelectedSubmissionIds;
    },
    get selectedSubmissions() {
      return mockSelectedSubmissions;
    },
    setSelectedSubmissionIds: mockSetSelectedSubmissionIds,
    addSubmission: mockAddSubmission,
    addMultipleSubmissions: mockAddMultipleSubmissions,
    removeSubmission: mockRemoveSubmission,
    clearSelections: mockClearSelections,
    get hasSelections() {
      return mockHasSelections;
    },
  }),
}));

describe("RisksTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectedSubmissionIds = new Set();
    mockSelectedSubmissions = [];
    mockHasSelections = false;
    mockClientFetch.mockResolvedValue({
      data: mockSubmissions,
      pagination_info: {
        total_pages: 1,
        total_records: 2,
      },
    });
  });

  it("renders table with submissions", async () => {
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
      expect(screen.getByText("Project Alpha")).toBeInTheDocument();
      expect(screen.getByText("APP-002")).toBeInTheDocument();
      expect(screen.getByText("Project Beta")).toBeInTheDocument();
    });
  });

  it("allows selecting individual rows", async () => {
    const user = userEvent.setup();
    render(<RisksTable awardRecommendationId="test-award-id" />);

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

  it("allows selecting all rows", async () => {
    const user = userEvent.setup();
    render(<RisksTable awardRecommendationId="test-award-id" />);

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
    mockHasSelections = true;

    render(<RisksTable awardRecommendationId="test-award-id" />);

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

  it("calls addSubmission when row is selected", async () => {
    const user = userEvent.setup();
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    await waitFor(() => {
      expect(mockAddSubmission).toHaveBeenCalledWith(mockSubmissions[0]);
    });
  });

  it("displays default None for risk and condition columns", async () => {
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const noneTexts = screen.getAllByText("defaultNone");
    expect(noneTexts.length).toBeGreaterThan(0);
  });

  it("handles API errors gracefully", async () => {
    mockClientFetch.mockRejectedValue(new Error("API Error"));
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("errorLoading")).toBeInTheDocument();
    });
  });

  it("calls clientFetch with correct parameters", async () => {
    render(<RisksTable awardRecommendationId="test-award-id" />);

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
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "APP-001" })).toBeInTheDocument();
    });
    const link = screen.getByRole("link", { name: "APP-001" });
    expect(link).toHaveAttribute(
      "href",
      "/award-recommendation/test-award-id/application-submissions/sub-1/edit",
    );
  });

  it("applies blue styling to recommended badges", async () => {
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const recommendedTag = screen.getByText(
      "recommendationType.recommended_for_funding",
    );
    expect(recommendedTag).toHaveClass("bg-info-lighter");
  });

  it("only shows Recommended tag for recommended_for_funding type", async () => {
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    // First submission has recommended_for_funding - should show tag
    expect(
      screen.getByText("recommendationType.recommended_for_funding"),
    ).toBeInTheDocument();

    // Second submission has not_recommended - should not show any tag text
    expect(
      screen.queryByText("recommendationType.not_recommended"),
    ).not.toBeInTheDocument();
  });

  it("applies teal checkbox styling class", async () => {
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toHaveClass("risks-table-checkbox");
    });
  });

  it("shows indeterminate checkbox when only some rows are selected", async () => {
    mockSelectedSubmissionIds = new Set(["sub-1"]);
    mockSelectedSubmissions = [mockSubmissions[0]];
    mockHasSelections = true;

    render(<RisksTable awardRecommendationId="test-award-id" />);

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
        total_records: 30,
      },
    });

    render(<RisksTable awardRecommendationId="test-award-id" />);

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

    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  it("shows banner with showing range and Edit button when selections exist", async () => {
    mockSelectedSubmissionIds = new Set(["sub-1"]);
    mockSelectedSubmissions = [mockSubmissions[0]];
    mockHasSelections = true;

    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    // Should show showing range text
    expect(screen.getByText("showingRange")).toBeInTheDocument();

    // Should show selection count text
    expect(screen.getByText("selectedCount")).toBeInTheDocument();

    // Should show Edit button
    const editButton = screen.getByRole("button", { name: "editButton" });
    expect(editButton).toBeInTheDocument();
  });

  it("hides Edit button when no selections", async () => {
    render(<RisksTable awardRecommendationId="test-award-id" />);

    await waitFor(() => {
      expect(screen.getByText("APP-001")).toBeInTheDocument();
    });

    // Should show showing range text
    expect(screen.getByText("showingRange")).toBeInTheDocument();

    // Should NOT show selection count or Edit button
    expect(screen.queryByText("selectedCount")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "editButton" }),
    ).not.toBeInTheDocument();
  });
});
