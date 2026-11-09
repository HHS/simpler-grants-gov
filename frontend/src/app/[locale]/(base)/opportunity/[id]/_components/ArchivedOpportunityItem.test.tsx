import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { ArchivedOpportunityItem } from "./ArchivedOpportunityItem";

// note that next-intl is mocked globally, translations render as their keys
jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

const renderItem = (summary: Partial<OpportunityDetail["summary"]>) =>
  render(
    <ArchivedOpportunityItem
      detail={{ summary: { ...summary } } as OpportunityDetail}
    />,
  );

describe("ArchivedOpportunityItem", () => {
  it("renders the archive and close dates", () => {
    renderItem({ archive_date: "2024-12-31", close_date: "2024-06-30" });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("archived:")).toBeInTheDocument();
    expect(screen.getByText("2024-12-31")).toBeInTheDocument();
    expect(screen.getByText("closed:")).toBeInTheDocument();
    expect(screen.getByText("2024-06-30")).toBeInTheDocument();
  });

  it.each([null, ""])(
    "shows not specified when the archive date is %p",
    (date) => {
      renderItem({ archive_date: date, close_date: "2024-06-30" });

      expect(screen.getByText("notSpecified")).toBeInTheDocument();
    },
  );

  it("shows not specified when there is no close date", () => {
    renderItem({ archive_date: "2024-12-31", close_date: null });

    expect(screen.getByText("notSpecified")).toBeInTheDocument();
  });

  it("renders the close date description with the close date", () => {
    renderItem({
      archive_date: "2024-12-31",
      close_date: "2024-06-30",
      close_date_description: "Applications closed early",
    });

    expect(screen.getByText("Applications closed early")).toBeInTheDocument();
  });
});
