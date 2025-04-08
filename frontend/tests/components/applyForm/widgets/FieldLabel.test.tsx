import { render, screen } from "@testing-library/react";

import { FieldLabel } from "src/components/applyForm/widgets/FieldLabel";

describe("FieldLabel", () => {
  it("renders the expected content and title", () => {
    render(<FieldLabel idFor={"test"} title="this label" required={false} />);

    expect(screen.getByText("this label")).toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("shows field is required", () => {
    render(<FieldLabel idFor={"test"} title="this label" required={true} />);

    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
