import { render, screen } from "@testing-library/react";

import { ConditionalFormActionError } from "src/components/ConditionalFormActionError";

const TypedConditionalFormActionError = ConditionalFormActionError<{
  someFieldName?: string[];
  anotherFieldName?: string[];
}>;

describe("ConditionalFormActionError", () => {
  it("matches snapshot", () => {
    const { container } = render(
      <TypedConditionalFormActionError
        fieldName="someFieldName"
        errors={{ someFieldName: ["special error"] }}
      />,
    );
    expect(container).toMatchSnapshot();
  });
  it("does not render error if no errors", () => {
    render(<TypedConditionalFormActionError fieldName="someFieldName" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("does not render error if no error matches field name", () => {
    render(
      <TypedConditionalFormActionError
        fieldName="someFieldName"
        errors={{ anotherFieldName: ["error"] }}
      />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("renders error for field name", () => {
    render(
      <TypedConditionalFormActionError
        fieldName="someFieldName"
        errors={{ someFieldName: ["special error"] }}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("special error")).toBeInTheDocument();
  });
});
