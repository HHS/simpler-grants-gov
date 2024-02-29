import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import AppLayout from "src/components/AppLayout";

describe("AppLayout", () => {
  it("renders children in main section", () => {
    render(
      <AppLayout>
        <h1>child</h1>
      </AppLayout>
    );

    const header = screen.getByRole("heading", { name: /child/i, level: 1 });

    expect(header).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(
      <AppLayout>
        <h1>child</h1>
      </AppLayout>
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
