import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { ClearSearchButton } from "src/components/search/ClearSearchButton";

const mockClearQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    clearQueryParams: (params: unknown) =>
      mockClearQueryParams(params) as unknown,
  }),
}));

describe("ClearSearchButton", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("does not have any accessibility violations", async () => {
    const { container } = render(<ClearSearchButton buttonText="hi" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("calls clearQueryParams on click", async () => {
    render(<ClearSearchButton buttonText="hi" />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(mockClearQueryParams).toHaveBeenCalledWith(undefined);
  });
  it("calls clearQueryParams with `paramsToClear` if provided", async () => {
    const paramsToClear = ["a", "bunch", "of", "random", "keys"];
    render(<ClearSearchButton buttonText="hi" paramsToClear={paramsToClear} />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(mockClearQueryParams).toHaveBeenCalledWith(paramsToClear);
  });

  it("includes icon where directed", () => {
    render(<ClearSearchButton buttonText="hi" includeIcon={true} />);

    // not sure why it's hidden, likely a jest thing
    const icon = screen.getByRole("img", { hidden: true });

    expect(icon).toBeInTheDocument();
  });
  it("displays button text", () => {
    render(<ClearSearchButton buttonText="hi" includeIcon={true} />);

    const buttonText = screen.getByText("hi");

    expect(buttonText).toBeInTheDocument();
  });
});
