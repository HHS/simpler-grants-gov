import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { ActivityDashboardLinksSection } from "src/components/workspace/ActivityDashboardLinksSection";

describe("ActivityDashboardLinksSection", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<ActivityDashboardLinksSection />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders heading and link cards with correct targets", () => {
    render(<ActivityDashboardLinksSection />);

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);

    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/applications");
    expect(hrefs).toContain("/saved-search-queries");
    expect(hrefs).toContain("/saved-opportunities");
  });
});
