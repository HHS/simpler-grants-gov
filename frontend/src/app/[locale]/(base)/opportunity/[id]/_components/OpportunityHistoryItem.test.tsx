import { render, renderHook, screen } from "@testing-library/react";

import {
  OpportunityHistoryItem,
  useFormatHistoryDate,
} from "./OpportunityHistoryItem";

jest.mock("src/utils/dateUtil", () => ({
  formatDate: jest.fn((date: string) => `formatted ${date}`),
}));

// note that next-intl is mocked globally, translations render as their keys

describe("OpportunityHistoryItem", () => {
  it("renders the label and value as a list item", () => {
    render(
      <ul>
        <OpportunityHistoryItem title="Version" content="2" />
      </ul>,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent("Version: 2");
  });

  it("renders a description in the same list item when provided", () => {
    render(
      <ul>
        <OpportunityHistoryItem
          title="Closed"
          content="June 30, 2024"
          description="Closed early"
        />
      </ul>,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Closed early")).toBeInTheDocument();
  });

  it("does not render a description when it is empty", () => {
    render(
      <ul>
        <OpportunityHistoryItem title="Closed" content="June 30, 2024" />
      </ul>,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent(
      "Closed: June 30, 2024",
    );
  });
});

describe("useFormatHistoryDate", () => {
  it("formats a date", () => {
    const { result } = renderHook(() => useFormatHistoryDate());

    expect(result.current("2024-06-30")).toBe("formatted 2024-06-30");
  });

  it.each([null, ""])("returns not specified for %p", (date) => {
    const { result } = renderHook(() => useFormatHistoryDate());

    expect(result.current(date)).toBe("notSpecified");
  });
});
