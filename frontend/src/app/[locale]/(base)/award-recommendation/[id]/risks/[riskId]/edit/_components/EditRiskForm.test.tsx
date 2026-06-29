import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import { updateRiskAction } from "src/app/[locale]/(base)/award-recommendation/[id]/risks/actions";
import { mockAwardRecommendationSubmissions } from "src/utils/testing/fixtures";

import EditRiskForm from "./EditRiskForm";

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
    updateRiskAction: jest.fn(),
  }),
);

jest.mock(
  "src/components/award-recommendation/SelectedApplicationsTable",
  () => ({
    __esModule: true,
    default: () => <div data-testid="selected-applications-table" />,
  }),
);

const mockRisk = {
  award_recommendation_risk_id: "risk-id-123",
  award_recommendation_risk_number: "RSK-26-00001",
  risk_number: 1,
  comment: "Existing risk summary",
  award_recommendation_risk_type: "additional_monitoring",
  condition: "Condition 1",
  award_recommendation_application_submission_ids: [
    mockAwardRecommendationSubmissions[0]
      .award_recommendation_application_submission_id,
  ],
  applications: [],
};

describe("EditRiskForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateRiskAction as jest.Mock).mockResolvedValue({ success: true });
  });

  it("renders selected applications and pre-filled risk summary", () => {
    render(
      <EditRiskForm
        awardRecommendationId="ar-id-123"
        risk={mockRisk}
        submissions={mockAwardRecommendationSubmissions}
      />,
    );

    expect(screen.getByText("selectedApplications")).toBeInTheDocument();
    expect(
      screen.getByTestId("selected-applications-table"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/riskSummaryLabel/)).toHaveValue(
      "Existing risk summary",
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("saves updated risk details and redirects to the edit page", async () => {
    const user = userEvent.setup();

    render(
      <EditRiskForm
        awardRecommendationId="ar-id-123"
        risk={mockRisk}
        submissions={mockAwardRecommendationSubmissions}
      />,
    );

    await user.clear(screen.getByLabelText(/riskSummaryLabel/));
    await user.type(
      screen.getByLabelText(/riskSummaryLabel/),
      "Updated summary",
    );
    await user.selectOptions(screen.getByRole("combobox"), "condition2");
    await user.click(screen.getByRole("button", { name: "saveButton" }));

    await waitFor(() => {
      expect(updateRiskAction).toHaveBeenCalledWith(
        "ar-id-123",
        "risk-id-123",
        {
          comment: "Updated summary",
          award_recommendation_risk_type: "additional_monitoring",
          award_recommendation_application_submission_ids: [
            mockAwardRecommendationSubmissions[0]
              .award_recommendation_application_submission_id,
          ],
        },
      );
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/award-recommendation/ar-id-123/edit",
    );
  });
});
