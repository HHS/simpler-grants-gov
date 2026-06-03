import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";

import { CreateRecommendationContent } from "./CreateRecommendationContent";

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

describe("CreateRecommendationContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the 'Before you get started' heading", () => {
    render(<CreateRecommendationContent />);
    expect(screen.getByText("beforeYouGetStarted")).toBeInTheDocument();
  });

  it("renders all three steps", () => {
    render(<CreateRecommendationContent />);

    expect(
      screen.getByText("steps.identifyOpportunity.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.applyRecommendations.title"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.provideAttachments.title"),
    ).toBeInTheDocument();
  });

  it("renders step descriptions", () => {
    render(<CreateRecommendationContent />);

    expect(
      screen.getByText("steps.identifyOpportunity.description"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.applyRecommendations.description"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.provideAttachments.description"),
    ).toBeInTheDocument();
  });

  it("renders bullet points for step 2", () => {
    render(<CreateRecommendationContent />);

    expect(
      screen.getByText("steps.applyRecommendations.bullet1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.applyRecommendations.bullet2"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.applyRecommendations.bullet3"),
    ).toBeInTheDocument();
  });

  it("renders bullet points for step 3", () => {
    render(<CreateRecommendationContent />);

    expect(
      screen.getByText("steps.provideAttachments.bullet1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.provideAttachments.bullet2"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("steps.provideAttachments.bullet3"),
    ).toBeInTheDocument();
  });

  it("renders Cancel and Next buttons", () => {
    render(<CreateRecommendationContent />);

    expect(screen.getByText("buttons.cancel")).toBeInTheDocument();
    expect(screen.getByText("buttons.next")).toBeInTheDocument();
  });

  it("calls router.back() when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<CreateRecommendationContent />);

    const cancelButton = screen.getByText("buttons.cancel");
    await user.click(cancelButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("renders numbered badges for each step", () => {
    render(<CreateRecommendationContent />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
