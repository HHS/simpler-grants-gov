import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import SearchSortBy from "src/components/search/SearchSortBy";

const updateQueryParamsMock = jest.fn();

// Mock the useSearchParamUpdater hook
jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: updateQueryParamsMock,
  }),
}));

describe("SearchSortBy", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchSortBy queryTerm="test" sortby="closeDateDesc" />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders correctly with initial query params", () => {
    render(<SearchSortBy queryTerm="test" sortby="" />);

    const defaultOption = screen.getByRole("option", {
      selected: true,
    });
    expect(defaultOption).toBeVisible();
    expect(defaultOption).toHaveTextContent("Most relevant (Default)");

    expect(screen.getAllByRole("option")).toHaveLength(11);
  });

  it("updates sort option and on change", () => {
    render(<SearchSortBy queryTerm="test" sortby="" />);

    let selectedOption = screen.getByRole("option", {
      selected: true,
    });

    expect(selectedOption).not.toHaveTextContent("Opportunity title (Z to A)");

    fireEvent.select(screen.getByRole("combobox"), {
      target: { value: "opportunityTitleDesc" },
    });

    selectedOption = screen.getByRole("option", {
      selected: true,
    });

    expect(selectedOption).toHaveTextContent("Opportunity title (Z to A)");
  });

  it("calls expected search update functions on change", () => {
    render(<SearchSortBy queryTerm="test" sortby="" />);

    fireEvent.change(screen.getByLabelText("sortBy.label"), {
      target: { value: "opportunityTitleDesc" },
    });

    expect(updateQueryParamsMock).toHaveBeenCalledWith(
      "opportunityTitleDesc",
      "sortby",
      "test",
    );
  });

  it("handles order number sort option change", () => {
    render(<SearchSortBy queryTerm="test" sortby="" />);

    let selectedOption = screen.getByRole("option", {
      selected: true,
    });

    expect(selectedOption).not.toHaveTextContent("Opportunity title (A to Z)");

    fireEvent.select(screen.getByRole("combobox"), {
      target: { value: "opportunityTitleAsc" },
    });

    selectedOption = screen.getByRole("option", {
      selected: true,
    });

    expect(selectedOption).toHaveTextContent("Opportunity title (A to Z)");
  });
});
