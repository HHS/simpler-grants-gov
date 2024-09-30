import { render, screen } from "@testing-library/react";
import { identity } from "lodash";

import SearchFilters from "src/components/search/SearchFilters";

describe("SearchFilters", () => {
  it("Renders without errors", () => {
    render(
      <SearchFilters
        opportunityStatus={identity}
        filterConfigurations={"click me"}
      />,
    );
    const component = screen.getByTestId("content-display-toggle");
    expect(component).toBeInTheDocument();
  });

  it("Calls toggle function with opposite value of current toggle state when toggle button is pressed", () => {
    const mockToggleFn = jest.fn();
    render(
      <SearchFilters
        setToggledContentVisible={mockToggleFn}
        toggledContentVisible={true}
        toggleText={"click me"}
      />,
    );

    const toggleButton = screen.getByText("click me");
    expect(toggleButton).toBeInTheDocument();

    toggleButton.click();

    expect(mockToggleFn).toHaveBeenCalledWith(false);
  });
});
