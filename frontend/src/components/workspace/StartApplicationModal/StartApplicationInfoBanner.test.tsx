import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { StartApplicationInfoBanner } from "./StartApplicationInfoBanner";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("StartApplicationInfoBanner", () => {
  it("renders the banner with title", () => {
    render(<StartApplicationInfoBanner />);
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("renders all 3 bullet points", () => {
    render(<StartApplicationInfoBanner />);
    expect(screen.getByText("bullet1")).toBeInTheDocument();
    expect(screen.getByText("bullet2")).toBeInTheDocument();
    expect(screen.getByText("bullet3")).toBeInTheDocument();
  });

  it("renders banner with correct test id", () => {
    render(<StartApplicationInfoBanner />);
    expect(screen.getByTestId("helpful-tips-banner")).toBeInTheDocument();
  });
});
