import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Research from "src/app/[locale]/research/page";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

describe("Research", () => {
  it("renders intro text", () => {
    render(<Research />);

    const content = screen.getByText("intro.content");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Research />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
