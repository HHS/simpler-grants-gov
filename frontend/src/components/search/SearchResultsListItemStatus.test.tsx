import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

import SearchResultListItemStatus from "src/components/search/SearchResultListItemStatus";

const defaultProps = {
  status: "posted",
  archivedString: "archived",
  closedString: "closed",
  forecastedString: "forecasted",
  postedString: "posted",
  archiveDate: "2023-01-01",
  closedDate: "2025-02-01",
};

describe("SearchResultListItemStatus", () => {
  it("renders component without violations", async () => {
    const { container } = render(
      <SearchResultListItemStatus {...defaultProps} />,
    );
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });

  it("renders opportunity title and status", () => {
    render(<SearchResultListItemStatus {...defaultProps} />);
    expect(screen.getByText("posted")).toBeInTheDocument();
    expect(screen.getByText("February 1, 2025")).toBeInTheDocument();
    expect(screen.queryByText("forecasted")).not.toBeInTheDocument();
  });
  it("renders -- if date not included", () => {
    render(<SearchResultListItemStatus {...defaultProps} closedDate={null} />);
    expect(screen.getByText("posted")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();
  });
});
