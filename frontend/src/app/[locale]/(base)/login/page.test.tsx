import { render } from "@testing-library/react";
import LoginPage from "src/app/[locale]/(base)/login/page";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseSearchParams = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

const mockGetItem = jest.spyOn(SessionStorage, "getItem");
const mockSetItem = jest.spyOn(SessionStorage, "setItem");
const mockRemoveItem = jest.spyOn(SessionStorage, "removeItem");

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("should replace to the stored URL from session storage", () => {
    mockGetItem.mockReturnValue("/test-redirect-path");

    render(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/test-redirect-path");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it.each([null, "", "https://malicious-site.com"])(
    "should replace to home once when the stored URL is %p",
    (saved) => {
      mockGetItem.mockReturnValue(saved);

      render(<LoginPage />);

      expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it("should flag the PIV error when returning with pivError", () => {
    mockGetItem.mockReturnValue("/newsletter");
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ pivError: "true" }),
    );

    render(<LoginPage />);

    expect(mockSetItem).toHaveBeenCalledWith("showPivError", "true");
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/newsletter");
  });

  it("should display 'Redirecting...' text", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = render(<LoginPage />);

    expect(container).toHaveTextContent("Redirecting...");
  });
});
