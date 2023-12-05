import { render, screen } from "@testing-library/react";

import ContentLayout from "src/components/ContentLayout";

describe("ContentLayout", () => {
  it("Renders without errors", () => {
    render(<ContentLayout>This is a test</ContentLayout>);
    const content = screen.getByText("This is a test");
    expect(content).toBeInTheDocument();
  });

  it("Renders a title if passed", () => {
    render(<ContentLayout title="test title">This is a test</ContentLayout>);
    const content = screen.getByText("test title");
    expect(content).toBeInTheDocument();
  });
});
