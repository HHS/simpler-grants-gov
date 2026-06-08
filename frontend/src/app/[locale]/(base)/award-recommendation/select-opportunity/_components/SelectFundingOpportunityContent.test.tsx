import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SelectFundingOpportunityContent } from "./SelectFundingOpportunityContent";

const pushMock = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      whichFundingOpportunity: "Which Funding Opportunity?",
      cancelButtonText: "Cancel",
    };

    return translations[key] ?? key;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("SelectFundingOpportunityContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the funding opportunity heading", () => {
    render(<SelectFundingOpportunityContent />);

    const heading = screen.getByRole("heading", {
      name: "Which Funding Opportunity?",
      level: 2,
    });

    expect(heading).toBeInTheDocument();
  });

  it("renders the cancel button", () => {
    render(<SelectFundingOpportunityContent />);

    const button = screen.getByRole("button", {
      name: "Cancel",
    });

    expect(button).toBeInTheDocument();
  });

  it("navigates to home when cancel is clicked", async () => {
    const user = userEvent.setup();

    render(<SelectFundingOpportunityContent />);

    await user.click(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(pushMock).toHaveBeenCalledWith("/");
  });
});