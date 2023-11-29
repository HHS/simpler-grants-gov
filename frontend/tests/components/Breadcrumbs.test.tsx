import { render, screen } from "@testing-library/react";
import { RESEARCH_CRUMBS } from "src/constants/breadcrumbs";

import Breadcrumbs from "src/components/Breadcrumbs";

describe("Footer", () => {
  it("Renders without errors", () => {
    render(<Breadcrumbs breadcrumbList={RESEARCH_CRUMBS} />);
    const bc = screen.getByTestId("breadcrumb");
    expect(bc).toBeInTheDocument();
  });
});
