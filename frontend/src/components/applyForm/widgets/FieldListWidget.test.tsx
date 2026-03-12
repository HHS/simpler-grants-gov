import { render, screen } from "@testing-library/react";

import FieldListWidget from "src/components/applyForm/widgets/FieldListWidget";

describe("FieldListWidget (stub)", () => {
  it("renders label and defaultSize", () => {
    render(
      <FieldListWidget
        id="contacts"
        key="contacts"
        schema={{}}
        label="Contacts"
        description="Add contacts"
        defaultSize={1}
        groupDefinition={[]}
        rawErrors={[]}
        requiredFields={[]}
      />,
    );

    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText(/defaultSize: 1/i)).toBeInTheDocument();
  });
});
