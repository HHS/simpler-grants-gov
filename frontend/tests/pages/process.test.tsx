import { render, screen, waitFor } from "tests/react-utils";

import { axe } from "jest-axe";
import Process from "src/app/[locale]/process/page";

describe("Process", () => {
  it("renders alert with grants.gov link", () => {
    render(<Process />);

    const alert = screen.getByTestId("alert");
    // There are multiple links to grants.gov
    const link = screen.getAllByText("www.grants.gov")[0];

    expect(alert).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://www.grants.gov");
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Process />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
