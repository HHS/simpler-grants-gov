import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import AwardRecommendationStatusTag from "src/components/award-recommendation/AwardRecommendationStatusTag";

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("AwardRecommendationStatusTag", () => {
  it("renders draft status tag", () => {
    render(<AwardRecommendationStatusTag status="draft" />);

    const tag = screen.getByTestId("award-recommendation-status-draft");
    expect(tag).toBeInTheDocument();
  });

  it("renders in progress status tag", () => {
    render(<AwardRecommendationStatusTag status="inProgress" />);

    const tag = screen.getByTestId("award-recommendation-status-in-progress");
    expect(tag).toBeInTheDocument();
  });

  it("renders pending review status tag", () => {
    render(<AwardRecommendationStatusTag status="pendingReview" />);

    const tag = screen.getByTestId(
      "award-recommendation-status-pending-review",
    );
    expect(tag).toBeInTheDocument();
  });
});
