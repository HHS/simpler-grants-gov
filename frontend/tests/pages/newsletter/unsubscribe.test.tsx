import { render, waitFor } from "tests/react-utils";
import { axe } from "jest-axe";
import NewsletterUnsubscribe from "src/app/[locale]/newsletter/unsubscribe/page";

describe("Newsletter", () => {
  it("passes accessibility scan", async () => {
    const { container } = render(<NewsletterUnsubscribe />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
