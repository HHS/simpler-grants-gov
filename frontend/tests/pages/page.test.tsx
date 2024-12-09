import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Home from "src/app/[locale]/page";
import { mockMessages, useTranslationsMock } from "src/utils/testing/intlMocks";

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

describe("Home", () => {
  it("renders intro text", () => {
    render(Home({ params: { locale: "en" } }));

    const content = screen.getByText("goal.paragraph_1");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(Home({ params: { locale: "en" } }));
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
