import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

import Breadcrumbs from "src/components/Breadcrumbs";

const crumbs = [
  {
    title: "Home",
    path: `/`,
  },
  {
    title: "Current",
  },
];

describe("Breadcrumbs", () => {
  it("has segments with link and text matching passed list", () => {
    render(<Breadcrumbs breadcrumbList={crumbs} />);

    const home = screen.getByRole("link", { name: /Home/i });
    expect(home).toBeInTheDocument();
    expect(home).toHaveAttribute("href", "/");
  });

  it("has a final segment that is not a link", () => {
    render(<Breadcrumbs breadcrumbList={crumbs} />);

    const currentSpan = screen.getByText("Current");
    expect(currentSpan).toBeInTheDocument();

    const currentLink = screen.queryByRole("link", { name: /Current/i });
    expect(currentLink).not.toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Breadcrumbs breadcrumbList={crumbs} />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
