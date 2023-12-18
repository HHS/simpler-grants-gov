import { render, screen } from "@testing-library/react";

import ContentLayout from "src/components/ContentLayout";

describe("ContentLayout", () => {
  it("Renders without errors", () => {
    render(<ContentLayout>This is a test</ContentLayout>);
    const content = screen.getByText("This is a test");
    expect(content).toBeInTheDocument();
  });

  it("Renders a title if a string is passed", () => {
    render(<ContentLayout title="string title">This is a test</ContentLayout>);
    const content = screen.getByText("string title");
    expect(content).toBeInTheDocument();
  });

  it("Renders a title if an element is passed", () => {
    const title = <>This is a node test.</>;
    render(<ContentLayout title={title}>This is a test</ContentLayout>);
    const content = screen.getByText("This is a node test.");
    expect(content).toBeInTheDocument();
  });
});
