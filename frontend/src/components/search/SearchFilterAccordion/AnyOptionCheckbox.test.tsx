import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import React from "react";

import { AnyOptionCheckbox } from "src/components/search/SearchFilterAccordion/AnyOptionCheckbox";

const mockSetQueryParam = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
  }),
}));

describe("AnyOptionCheckbox", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <AnyOptionCheckbox title={"any"} checked={false} queryParamKey={"any"} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("calls the appropriate handlers when the checkbox is checked", async () => {
    render(
      <AnyOptionCheckbox title={"any"} checked={false} queryParamKey={"any"} />,
    );

    // Simulate user clicking the checkbox
    const checkbox = await screen.findByRole("checkbox");
    await userEvent.click(checkbox);

    // Wait for the updateCheckedOption function to be called with the checkbox being checked
    await waitFor(() => {
      expect(mockSetQueryParam).toHaveBeenCalledWith("any", "");
    });
  });

  it("calls the appropriate handlers when the checkbox is checked (default value edition)", async () => {
    render(
      <AnyOptionCheckbox
        title={"any"}
        checked={false}
        queryParamKey={"any"}
        defaultEmptySelection={new Set(["default"])}
      />,
    );

    // Simulate user clicking the checkbox
    const checkbox = await screen.findByRole("checkbox");
    await userEvent.click(checkbox);

    // Wait for the updateCheckedOption function to be called with the checkbox being checked
    await waitFor(() => {
      expect(mockSetQueryParam).toHaveBeenCalledWith("any", "default");
    });
  });

  it("does nothing when clicked if the checkbox is already checked", async () => {
    render(
      <AnyOptionCheckbox title={"any"} checked={true} queryParamKey={"any"} />,
    );

    // Simulate user clicking the checkbox
    const checkbox = await screen.findByRole("checkbox");
    await userEvent.click(checkbox);

    expect(mockSetQueryParam).toHaveBeenCalledTimes(0);
  });

  it("displays the correct label", () => {
    render(
      <AnyOptionCheckbox
        title={"For the title"}
        checked={false}
        queryParamKey={"any"}
      />,
    );
    const label = screen.getByText("any For the title");
    expect(label).toBeInTheDocument();
  });
});
