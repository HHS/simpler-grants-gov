import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import PageNotFound from "src/pages/404";

describe("PageNotFound", () => {
  it("does not render alert with grants.gov link", () => {
    render(<PageNotFound />);

    const alert = screen.queryByTestId("alert");

    expect(alert).not.toBeInTheDocument();
  });

  it("links back to the home page", () => {
    render(<PageNotFound />);
    const link = screen.getByRole("link", { name: /Return Home/i });

    expect(link).toBeInTheDocument();
  })

  it("passes accessibility scan", async () => {
    const { container } = render(<PageNotFound />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});