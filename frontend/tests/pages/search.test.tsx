import { render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import Search from "src/pages/search";

describe("Search", () => {
  it("passes accessibility scan", async () => {
    const { container } = render(<Search />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
