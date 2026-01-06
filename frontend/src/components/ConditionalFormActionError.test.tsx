import { render, screen } from "@testing-library/react";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";

type Errors = {
  someFieldName?: string[];
  anotherFieldName?: string[];
};

const Typed = ConditionalFormActionError<Errors>;

describe("ConditionalFormActionError", () => {
  it("does not render if no errors provided", () => {
    const { container } = render(<Typed fieldName="someFieldName" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render if no error matches field name", () => {
    render(
      <Typed
        fieldName="someFieldName"
        errors={{ anotherFieldName: ["error"] }}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("error")).not.toBeInTheDocument();
  });

  it("renders the first error message for the field", () => {
    render(
      <Typed
        fieldName="someFieldName"
        errors={{ someFieldName: ["special error", "secondary error"] }}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("special error")).toBeInTheDocument();
    expect(screen.queryByText("secondary error")).not.toBeInTheDocument();
  });
});
