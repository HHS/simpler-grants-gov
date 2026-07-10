import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

import SearchResultsListItemStatus, {
  SearchResultsListItemStatusProps,
} from "./SearchResultsListItemStatus";

const defaultProps: SearchResultsListItemStatusProps = {
  status: "posted",
  archivedString: "archived",
  closedString: "closed",
  forecastedString: "forecasted",
  postedString: "posted",
  archiveDate: "2023-01-01",
  closedDate: "2025-02-01",
};

const renderWithDl = (props = defaultProps) =>
  render(
    <dl>
      <SearchResultsListItemStatus {...props} />
    </dl>,
  );
describe("SearchResultsListItemStatus", () => {
  it("renders component without violations", async () => {
    const { container } = renderWithDl();
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });

  it("renders opportunity title and status", () => {
    renderWithDl();
    expect(screen.getByText("posted")).toBeInTheDocument();
    expect(screen.getByText("February 1, 2025")).toBeInTheDocument();
    expect(screen.queryByText("forecasted")).not.toBeInTheDocument();
  });
  it("renders -- if date not included", () => {
    renderWithDl({ ...defaultProps, closedDate: null });
    expect(screen.getByText("posted")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();
  });
});
