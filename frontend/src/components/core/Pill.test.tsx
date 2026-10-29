import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Pill } from "src/components/core/Pill";

describe("Pill", () => {
  it("renders with label", () => {
    render(<Pill label="any sort of label" onClose={() => undefined} />);
    expect(screen.getByText("any sort of label")).toBeInTheDocument();
  });
  it("calls onClose", async () => {
    const closeSpy = jest.fn();
    render(<Pill label="any sort of label" onClose={closeSpy} />);
    const closeIcon = screen.getByLabelText("Remove any sort of label pill");
    await userEvent.click(closeIcon);
    expect(closeSpy).toHaveBeenCalled();
  });
  it("uses labelPrefix in the accessible name when provided", () => {
    render(
      <Pill
        label="Cost sharing: No"
        labelPrefix="filter"
        onClose={() => undefined}
      />,
    );
    expect(
      screen.getByLabelText("Remove filter,Cost sharing: No"),
    ).toBeInTheDocument();
  });
});
