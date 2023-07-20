import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import Index from "src/pages/index";

describe("Index", () => {
  // Demonstration of rendering translated text, and asserting the presence of a dynamic value.
  // You can delete this test for your own project.
  it("renders link to Next.js docs", () => {
    render(<Index />);

    const link = screen.getByRole("link", { name: /next\.js/i });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://nextjs.org/docs");
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Index />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
