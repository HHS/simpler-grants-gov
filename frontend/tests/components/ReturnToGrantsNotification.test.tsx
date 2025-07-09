import { render, screen } from "@testing-library/react";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { ReturnToGrantsNotification } from "src/components/ReturnToGrantsNotification";

const mockGetSessionStorageItem = jest.fn();
const mockSetSessionStorageItem = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

jest.mock("src/services/sessionStorage/useSessionStorage", () => ({
  useSessionStorage: () => ({
    getSessionStorageItem: mockGetSessionStorageItem,
    setSessionStorageItem: mockSetSessionStorageItem,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("ReturnToGrantsNotification", () => {
  afterEach(() => jest.resetAllMocks());
  it("sets session storage if utm source param points to grants.gov", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("utm_source=Grants.gov"),
    );
    render(<ReturnToGrantsNotification />);

    expect(mockSetSessionStorageItem).toHaveBeenCalledWith(
      "showLegacySearchReturnNotification",
      "true",
    );
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("displays link if session storage is set", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockGetSessionStorageItem.mockReturnValue("true");
    render(<ReturnToGrantsNotification />);

    expect(screen.getByRole("link")).toBeInTheDocument();
  });
  it("does not display a link if utm source and session storage are not set", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockGetSessionStorageItem.mockReturnValue("false");
    render(<ReturnToGrantsNotification />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
