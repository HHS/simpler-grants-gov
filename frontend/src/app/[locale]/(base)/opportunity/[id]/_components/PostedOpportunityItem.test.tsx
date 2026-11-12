import { render, screen } from "@testing-library/react";
import { OpportunityDetail } from "src/types/opportunity/opportunityResponseTypes";

import { PostedOpportunityItem } from "./PostedOpportunityItem";

// note that next-intl is mocked globally, translations render as their keys
jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => date),
}));

const renderItem = (summary: Partial<OpportunityDetail["summary"]>) =>
  render(
    <PostedOpportunityItem
      detail={{ summary: { ...summary } } as OpportunityDetail}
    />,
  );

describe("PostedOpportunityItem", () => {
  it("renders the close date", () => {
    renderItem({ close_date: "2024-06-30" });

    expect(screen.getByText("closing:")).toBeInTheDocument();
    expect(screen.getByText("2024-06-30")).toBeInTheDocument();
  });

  it("renders the close date description with the close date", () => {
    renderItem({
      close_date: "2024-06-30",
      close_date_description: "Applications due by noon",
    });

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Applications due by noon")).toBeInTheDocument();
  });

  it("renders the close date description when there is no close date", () => {
    renderItem({
      close_date: null,
      close_date_description: "Applications due by noon",
    });

    expect(screen.getByText("notSpecified")).toBeInTheDocument();
    expect(screen.getByText("Applications due by noon")).toBeInTheDocument();
  });

  it("does not render a description element when there is none", () => {
    renderItem({ close_date: "2024-06-30", close_date_description: null });

    expect(
      screen.queryByText("Applications due by noon"),
    ).not.toBeInTheDocument();
  });

  it.each([null, ""])(
    "shows not specified when the close date is %p",
    (date) => {
      renderItem({ close_date: date });

      expect(screen.getByText("notSpecified")).toBeInTheDocument();
    },
  );
});
