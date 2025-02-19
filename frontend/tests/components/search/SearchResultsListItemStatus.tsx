import { axe } from "jest-axe";
import { render, screen, waitFor } from "tests/react-utils";

import SearchResultListItemStatus from "src/components/search/SearchResultListItemStatus";

describe("SearchResultListItemStatus", () => {
  it("renders component without violations", async () => {
    const { container } = render(
      <SearchResultListItemStatus
        status="posted"
        archivedString="archived"
        closedString="closed"
        forecastedString="forecasted"
        postedString="posted"
        archiveDate="2023-01-01"
        closedDate="2023-02-01"
      />,
    );
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });

  it("renders opportunity title and status", () => {
    render(
      <SearchResultListItemStatus
        status="posted"
        archivedString="archived"
        closedString="closed"
        forecastedString="forecasted"
        postedString="posted"
        archiveDate="2025-01-01"
        closedDate="2023-02-01"
      />,
    );
    expect(screen.getByText("posted")).toBeInTheDocument();
    expect(screen.getByText("2023-02-01")).toBeInTheDocument();
    expect(screen.queryByText("forecasted")).not.toBeInTheDocument();
  });
  it("renders -- if date not included", () => {
    render(
      <SearchResultListItemStatus
        status="posted"
        archivedString="archived"
        closedString="closed"
        forecastedString="forecasted"
        postedString="posted"
        archiveDate="2025-01-01"
        closedDate={null}
      />,
    );
    expect(screen.getByText("posted")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();
  });
});
