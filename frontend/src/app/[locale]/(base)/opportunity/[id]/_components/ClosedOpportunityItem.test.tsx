import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { ClosedOpportunityItem } from "./ClosedOpportunityItem";

// note that next-intl is mocked globally, translations render as their keys
jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

const renderItem = (summary: Partial<OpportunityDetail["summary"]>) =>
  render(
    <ClosedOpportunityItem
      detail={{ summary: { ...summary } } as OpportunityDetail}
    />,
  );

describe("ClosedOpportunityItem", () => {
  it("renders the close date", () => {
    renderItem({ close_date: "2024-06-30" });

    expect(screen.getByText("closed:")).toBeInTheDocument();
    expect(screen.getByText("2024-06-30")).toBeInTheDocument();
  });

  it.each([null, ""])(
    "shows not specified when the close date is %p",
    (date) => {
      renderItem({ close_date: date });

      expect(screen.getByText("notSpecified")).toBeInTheDocument();
    },
  );

  it("renders the close date description with the close date", () => {
    renderItem({
      close_date: "2024-06-30",
      close_date_description: "Applications closed early",
    });

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Applications closed early")).toBeInTheDocument();
  });
});
