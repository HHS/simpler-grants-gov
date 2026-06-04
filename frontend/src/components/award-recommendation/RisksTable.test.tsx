import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import RisksTable from "./RisksTable";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
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

const mockAddSubmission = jest.fn((submission) => {
  mockSelectedSubmissionIds.add(
    submission.award_recommendation_application_submission_id,
  );
  mockSelectedSubmissions.push(submission);
  mockHasSelections = true;
});

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
      expect(mockAddSubmission).toHaveBeenCalledTimes(2);
      expect(mockAddSubmission).toHaveBeenCalledWith(mockSubmissions[0]);
      expect(mockAddSubmission).toHaveBeenCalledWith(mockSubmissions[1]);
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
});
