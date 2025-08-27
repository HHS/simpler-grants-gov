import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import Subscribe from "src/app/[locale]/(base)/newsletter/page";
import { localeParams, useTranslationsMock } from "src/utils/testing/intlMocks";

const mockSetItem = jest.fn();
const mockGetItem = jest.fn();

jest.mock("react-dom", () => {
  const originalModule =
    jest.requireActual<typeof import("react-dom")>("react-dom");

  return {
    ...originalModule,
    useFormStatus: jest.fn(() => ({ pending: false })),
  };
});

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("src/services/sessionStorage/sessionStorage", () => {
  return {
    __esModule: true,
    default: {
      setItem: (key: string, value: string) =>
        mockSetItem(key, value) as unknown,
      getItem: (key: string) => mockGetItem(key) as unknown,
    },
  };
});

describe("Subscribe", () => {
  it("renders title text", () => {
    render(Subscribe({ params: localeParams }));

    const content = screen.getByText("title");

    expect(content).toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const { container } = render(Subscribe({ params: localeParams }));
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
