import { render, screen } from "@testing-library/react";

import { ReturnToGrantsNotification } from "src/components/ReturnToGrantsNotification";

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockUseSearchParams = jest.fn();

const legacyLink = "http://legacy.com";

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams() as unknown,
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

describe("ReturnToGrantsNotification", () => {
  afterEach(() => jest.resetAllMocks());
  it("sets session storage if utm source param points to grants.gov", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("utm_source=Grants.gov"),
    );
    render(<ReturnToGrantsNotification legacyLink={legacyLink} />);

    expect(mockSetItem).toHaveBeenCalledWith(
      "showLegacySearchReturnNotification",
      "true",
    );
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("displays link if session storage is set", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockGetItem.mockReturnValue("true");
    render(<ReturnToGrantsNotification legacyLink={legacyLink} />);

    expect(screen.getByRole("link")).toBeInTheDocument();
  });
  it("does not display a link if utm source and session storage are not set", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockGetItem.mockReturnValue("false");
    render(<ReturnToGrantsNotification legacyLink={legacyLink} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("links to the correct location", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockGetItem.mockReturnValue("true");
    render(<ReturnToGrantsNotification legacyLink={legacyLink} />);

    expect(screen.getByRole("link")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", legacyLink);
  });
});
