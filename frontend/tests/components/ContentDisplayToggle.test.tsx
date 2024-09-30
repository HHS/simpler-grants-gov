import { render, screen } from "@testing-library/react";
import { identity } from "lodash";

import ContentDisplayToggle from "src/components/ContentDisplayToggle";

describe("ContentDisplayToggle", () => {
  it("Renders without errors", () => {
    render(
      <ContentDisplayToggle
        setToggledContentVisible={identity}
        toggledContentVisible={false}
        toggleText={"click me"}
      />,
    );
    const component = screen.getByTestId("content-display-toggle");
    expect(component).toBeInTheDocument();
  });

  it("Calls toggle function with opposite value of current toggle state when toggle button is pressed", () => {
    const mockToggleFn = jest.fn();
    render(
      <ContentDisplayToggle
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
