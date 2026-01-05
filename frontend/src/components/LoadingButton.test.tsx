import { render, screen } from "@testing-library/react";

import { LoadingButton } from "src/components/LoadingButton";

describe("LoadingButton", () => {
  it("is disabled", () => {
    render(<LoadingButton message="loading" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
  it("displays passed message", () => {
    render(<LoadingButton message="loading" />);
    expect(screen.getByRole("button")).toHaveTextContent("loading");
  });
  it("displays spinner", () => {
    render(<LoadingButton message="loading" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
