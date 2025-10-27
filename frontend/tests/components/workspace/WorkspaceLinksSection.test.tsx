import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { WorkspaceLinksSection } from "src/components/workspace/WorkspaceLinksSection";

jest.mock("next-intl/server", () => ({
  // eslint-disable-next-line react-hooks/rules-of-hooks
  getTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("WorkspaceLinksSection", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(await WorkspaceLinksSection());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("matches snapshot", async () => {
    const { container } = render(await WorkspaceLinksSection());
    expect(container).toMatchSnapshot();
  });

  it("renders section heading and link cards with correct targets", async () => {
    render(await WorkspaceLinksSection());

    // top-level heading (h2) should exist
    const topHeading = screen.getByRole("heading", { level: 2 });
    expect(topHeading).toBeInTheDocument();

    // There should be two link targets for the two cards rendered
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);

    // Ensure links point to the expected pages
    const hrefs = links.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/saved-search-queries");
    expect(hrefs).toContain("/saved-opportunities");
  });
});
