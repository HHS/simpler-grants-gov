import { render, screen } from "@testing-library/react";

import AwardRecommendationSubmissionEditHero from "./AwardRecommendationSubmissionEditHero";

describe("AwardRecommendationSubmissionEditHero", () => {
  const defaultProps = {
    awardRecommendationId: "ar-id-123",
    awardRecommendationBreadcrumbTitle: "Award Rec #: AR-26-0002",
    applicationSubmissionNumber: "APP-26-00001",
    applicationId: "app-id-456",
    awardRecsLabel: "Award Recs",
    editTitle: "Edit APP-26-00001",
    viewOriginalApplicationLabel: "View original application",
    cancelLabel: "Cancel",
    saveLabel: "Save",
  };

  it("renders breadcrumb, title, action buttons, and application link", () => {
    render(<AwardRecommendationSubmissionEditHero {...defaultProps} />);

    expect(
      screen.getByTestId("award-recommendation-submission-edit-hero"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("award-recommendation-submission-edit-hero"),
    ).toHaveClass("bg-base-lightest");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Edit APP-26-00001",
    );

    const applicationLink = screen.getByRole("link", {
      name: /View original application/i,
    });
    expect(applicationLink).toBeVisible();
    expect(applicationLink).toHaveAttribute(
      "href",
      "/workspace/applications/app-id-456",
    );
    expect(applicationLink).toHaveAttribute("target", "_blank");
    expect(applicationLink).toHaveTextContent("APP-26-00001");

    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
      "href",
      "/award-recommendation/ar-id-123/edit",
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});
