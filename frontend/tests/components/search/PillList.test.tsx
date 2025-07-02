import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { fakeFilterPillLabelData } from "src/utils/testing/fixtures";

import { PillList } from "src/components/search/PillList";

const mockRemoveQueryParamValue = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    removeQueryParamValue: (...args: unknown[]) =>
      mockRemoveQueryParamValue(...args) as unknown,
  }),
}));

describe("PillList", () => {
  it("passes accessibility test", async () => {
    const { container } = render(<PillList pills={fakeFilterPillLabelData} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  it("renders nothing if no pill data passed in", () => {
    render(<PillList pills={[]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("renders all passed in pills as expected", async () => {
    render(<PillList pills={fakeFilterPillLabelData} />);

    const firstLabel = screen.getByText("whatever");
    expect(firstLabel).toBeInTheDocument();

    const firstButton = screen.getByRole("button", {
      name: "Remove whatever pill",
    });
    expect(firstButton).toBeInTheDocument();

    await userEvent.click(firstButton);
    expect(mockRemoveQueryParamValue).toHaveBeenCalledWith(
      "status",
      "whichever",
    );

    const secondLabel = screen.getByText("another");
    expect(secondLabel).toBeInTheDocument();

    const secondButton = screen.getByRole("button", {
      name: "Remove another pill",
    });
    expect(secondButton).toBeInTheDocument();

    await userEvent.click(secondButton);
    expect(mockRemoveQueryParamValue).toHaveBeenCalledWith(
      "category",
      "overHere",
    );
  });
});
