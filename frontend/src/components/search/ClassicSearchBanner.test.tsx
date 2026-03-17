import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";

import ClassicSearchBanner from "src/components/search/ClassicSearchBanner";

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

describe("ClassicSearchBanner", () => {
  it("renders banner text", () => {
    render(<ClassicSearchBanner />);
    const content = screen.getByText("goToGG");
    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<ClassicSearchBanner />);
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });
});
