import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Events from "src/app/[locale]/(base)/events/page";
import {
  localeParams,
  mockMessages,
  useTranslationsMock,
} from "src/utils/testing/intlMocks";

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

describe("Events", () => {
  it("renders intro text", () => {
    render(Events({ params: localeParams }));

    const content = screen.getByText("pageDescription");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(Events({ params: localeParams }));
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
