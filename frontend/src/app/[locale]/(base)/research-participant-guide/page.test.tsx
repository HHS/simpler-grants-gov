import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import ResearchParticipantGuide from "src/app/[locale]/(base)/research-participant-guide/page";
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

describe("ResearchParticipantGuide", () => {
  it("renders h1", () => {
    render(<ResearchParticipantGuide />);
    const content = screen.getByText("h1");
    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<ResearchParticipantGuide />);
    const results = await waitFor(() => axe(container));
    expect(results).toHaveNoViolations();
  });
});
