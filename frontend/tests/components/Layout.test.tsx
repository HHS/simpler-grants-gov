import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import Layout from "src/components/Layout";

describe("Layout", () => {
  it("renders children in main section", () => {
    render(
      <Layout>
        <h1>child</h1>
      </Layout>
    );

    const header = screen.getByRole("heading", { name: /child/i, level: 1 });

    expect(header).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(
      <Layout>
        <h1>child</h1>
      </Layout>
    );
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
