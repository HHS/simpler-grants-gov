import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Developer from "src/app/[locale]/(base)/developer/page";
import { mockMessages, useTranslationsMock } from "src/utils/testing/intlMocks";

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

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
}));

// Mock the DeveloperPageSections component
jest.mock("src/components/developer/DeveloperSections", () => {
  return function MockDeveloperPageSections() {
    return (
      <div data-testid="developer-sections">
        <h1>Developer Portal</h1>
        <p>Welcome to the developer portal</p>
      </div>
    );
  };
});

describe("Developer Page", () => {
  it("renders developer page sections", () => {
    render(<Developer />);

    expect(screen.getByTestId("developer-sections")).toBeInTheDocument();
    expect(screen.getByText("Developer Portal")).toBeInTheDocument();
    expect(
      screen.getByText("Welcome to the developer portal"),
    ).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Developer />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
