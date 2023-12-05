import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import Newsletter from "src/pages/newsletter";

describe("Newsletter", () => {
  it("renders signup form with a submit button", () => {
    render(<Newsletter />);

    const sendyform = screen.getByTestId("sendy-form");

    expect(sendyform).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Newsletter />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
