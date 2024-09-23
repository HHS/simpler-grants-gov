import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Process from "src/app/[locale]/process/page";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

describe("Process", () => {
  it("renders intro text", () => {
    render(<Process />);

    const content = screen.getByText("intro.content");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Process />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
