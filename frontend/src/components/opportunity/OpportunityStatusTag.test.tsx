import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityStatusTag from "./OpportunityStatusTag";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("OpportunityStatusTag", () => {
  it("renders draft status with icon", () => {
    render(<OpportunityStatusTag status="draft" />);
    expect(screen.getByTestId("opportunity-status-draft")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("renders posted status", () => {
    render(<OpportunityStatusTag status="posted" />);
    expect(screen.getByTestId("opportunity-status-posted")).toBeInTheDocument();
    expect(screen.getByText("posted")).toBeInTheDocument();
  });

  it("renders forecasted status", () => {
    render(<OpportunityStatusTag status="forecasted" />);
    expect(
      screen.getByTestId("opportunity-status-forecasted"),
    ).toBeInTheDocument();
    expect(screen.getByText("forecasted")).toBeInTheDocument();
  });

  it("renders archived status", () => {
    render(<OpportunityStatusTag status="archived" />);
    expect(
      screen.getByTestId("opportunity-status-archived"),
    ).toBeInTheDocument();
    expect(screen.getByText("archived")).toBeInTheDocument();
  });

  it("renders closed status", () => {
    render(<OpportunityStatusTag status="closed" />);
    expect(screen.getByTestId("opportunity-status-closed")).toBeInTheDocument();
    expect(screen.getByText("closed")).toBeInTheDocument();
  });
});
