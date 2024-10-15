import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Home from "src/app/[locale]/page";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

describe("Home", () => {
  it("renders intro text", () => {
    render(<Home />);

    const content = screen.getByText("goal.paragraph_1");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Home />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
