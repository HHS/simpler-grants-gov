import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Home from "src/app/[locale]/(base)/page";

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

describe("Home", () => {
  it("renders intro text", () => {
    render(Home());

    const content = screen.getByText("pageTitle");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(Home());
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
