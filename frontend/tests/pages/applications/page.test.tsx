import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Applications from "src/app/[locale]/(base)/applications/page";
import { localeParams, useTranslationsMock } from "src/utils/testing/intlMocks";

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
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe("ApplicationList", () => {
  it("renders text when no applications are saved", async () => {
    render(<Applications params={localeParams} />);

    expect(
      await screen.findByText("noApplicationsMessage.primary"),
    ).toBeVisible();
    expect(
      await screen.findByText("noApplicationsMessage.secondary"),
    ).toBeVisible();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(<Applications params={localeParams} />);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
