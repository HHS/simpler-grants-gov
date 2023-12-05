import { render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import NewsletterConfirmation from "src/pages/newsletter-confirmation";

describe("Newsletter", () => {
  it("passes accessibility scan", async () => {
    const { container } = render(<NewsletterConfirmation />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
