import { render, screen } from "@testing-library/react";
import { Summary } from "src/types/opportunity/opportunityResponseTypes";
import { formatDate } from "src/utils/dateUtil";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import OpportunityHistory from "src/components/opportunity/OpportunityHistory";

// Mock the formatDate function
jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

// Mock `useTranslations`
jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

const mockSummary = {
  post_date: "2024-01-15",
  archive_date: "2024-12-31",
  version_number: 1,
} as Summary;

describe("OpportunityHistory", () => {
  it("renders history section with dates formatted correctly", () => {
    render(<OpportunityHistory status="posted" summary={mockSummary} />);

    expect(screen.getByText("history")).toBeInTheDocument();

    expect(screen.getByText("version:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    expect(screen.getByText("postedDate:")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();

    expect(screen.getByText("archiveDate:")).toBeInTheDocument();
    expect(screen.getByText("2024-12-31")).toBeInTheDocument();
  });

  it("calls formatDate for date fields", () => {
    render(<OpportunityHistory status="posted" summary={mockSummary} />);

    // Check that formatDate is called with the right dates
    expect(formatDate).toHaveBeenCalledWith("2024-01-15");
    expect(formatDate).toHaveBeenCalledWith("2024-12-31");
  });

  it("displays correct defaults when null values are present", () => {
    render(
      <OpportunityHistory
        status="posted"
        summary={
          {
            post_date: null,
            archive_date: null,
            version_number: null,
          } as Summary
        }
      />,
    );

    const firstHeading = screen.getByText("history");
    // eslint-disable-next-line testing-library/no-node-access
    expect(firstHeading.nextSibling).toHaveTextContent("--");

    const secondHeading = screen.getByText("version:");
    // eslint-disable-next-line testing-library/no-node-access
    expect(secondHeading.nextSibling).toHaveTextContent("--");
    const thirdHeading = screen.getByText("postedDate:");
    // eslint-disable-next-line testing-library/no-node-access
    expect(thirdHeading.nextSibling).toHaveTextContent("--");
    const fifthHeading = screen.getByText("archiveDate:");
    // eslint-disable-next-line testing-library/no-node-access
    expect(fifthHeading.nextSibling).toHaveTextContent("--");
  });
});
