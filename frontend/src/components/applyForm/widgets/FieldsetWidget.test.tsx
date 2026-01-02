import { render, screen } from "@testing-library/react";

import { FieldsetWidget } from "src/components/applyForm/widgets/FieldsetWidget";

describe("FieldsetWidget", () => {
  it("renders the expected content and title", () => {
    render(
      <FieldsetWidget label={"test"} fieldName="this label">
        <div>children</div>
      </FieldsetWidget>,
    );

    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("children")).toBeInTheDocument();
  });
});
