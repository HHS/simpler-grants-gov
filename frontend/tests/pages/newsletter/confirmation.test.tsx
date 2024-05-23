import { render, waitFor } from "tests/react-utils";
import { axe } from "jest-axe";
import NewsletterConfirmation from "src/app/[locale]/newsletter/confirmation/page";

describe("Newsletter", () => {
  it("passes accessibility scan", async () => {
    const { container } = render(<NewsletterConfirmation />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
