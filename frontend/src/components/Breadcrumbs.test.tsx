import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

import Breadcrumbs from "src/components//Breadcrumbs";

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
  it("Has a 'Home' item that is link", () => {
    render(<Breadcrumbs breadcrumbList={crumbs} />);

    const home = screen.getByRole("link", { name: /Home/i });
    expect(home).toBeInTheDocument();
  });

  it("Has a 'Current' item that is not a link", () => {
    render(<Breadcrumbs breadcrumbList={crumbs} />);

    const currentspan = screen.getByText("Current");
    expect(currentspan).toBeInTheDocument();

    const currentlink = screen.queryByRole("link", { name: /Current/i });
    expect(currentlink).not.toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Breadcrumbs breadcrumbList={crumbs} />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
