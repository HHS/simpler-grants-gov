import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Vision from "src/app/[locale]/(base)/vision/page";

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

describe("Vision", () => {
  it("renders header title text", () => {
    render(<Vision />);
    const content = screen.getByText("pageHeaderTitle");
    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Vision />);
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });
});
