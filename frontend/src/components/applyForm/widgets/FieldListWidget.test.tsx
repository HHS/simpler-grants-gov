import { render, screen } from "@testing-library/react";

import FieldListWidget from "src/components/applyForm/widgets/FieldListWidget";

describe("FieldListWidget (stub)", () => {
  it("renders label and defaultSize", () => {
    render(
      <FieldListWidget
        id="contacts"
        schema={{}}
        label="Contacts"
        description="Add contacts"
        defaultSize={2}
      />,
    );

    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText(/defaultSize: 2/i)).toBeInTheDocument();
  });
});
