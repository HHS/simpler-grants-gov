import { render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import NewsletterUnsubscribe from "src/pages/newsletter-unsubscribe";

describe("Newsletter", () => {
  it("passes accessibility scan", async () => {
    const { container } = render(<NewsletterUnsubscribe />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
