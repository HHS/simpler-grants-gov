import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Developer from "src/app/[locale]/(base)/developers/page";

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

// Mock the DevelopersPageSections component
jest.mock("src/components/developers/DevelopersSections", () => {
  return function MockDevelopersPageSections() {
    return (
      <div data-testid="developer-sections">
        <h1>Developers</h1>
        <p>Welcome to the developer portal</p>
      </div>
    );
  };
});

describe("Developer Page", () => {
  it("renders developer page sections", () => {
    render(<Developer />);

    expect(screen.getByTestId("developer-sections")).toBeInTheDocument();
    expect(screen.getByText("Developers")).toBeInTheDocument();
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
