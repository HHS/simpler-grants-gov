import { render } from "@testing-library/react";
import LoginPage from "src/app/[locale]/(base)/login/page";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseSearchParams = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };
const mockGetLoginRedirectFallback = jest.fn();
const mockClearFallbackAction = jest.fn(() => Promise.resolve());

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

jest.mock("src/services/auth/loginRedirectFallback", () => ({
  getLoginRedirectFallback: () => mockGetLoginRedirectFallback() as unknown,
}));

jest.mock("src/app/[locale]/(base)/login/actions", () => ({
  clearLoginRedirectFallbackAction: () => mockClearFallbackAction(),
}));

const mockGetItem = jest.spyOn(SessionStorage, "getItem");
const mockSetItem = jest.spyOn(SessionStorage, "setItem");
const mockRemoveItem = jest.spyOn(SessionStorage, "removeItem");

const renderLoginPage = async () => render(await LoginPage());

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockGetLoginRedirectFallback.mockResolvedValue(undefined);
  });

  it("should replace to the stored URL from session storage", async () => {
    mockGetItem.mockReturnValue("/test-redirect-path");

    await renderLoginPage();

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/test-redirect-path");
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockClearFallbackAction).not.toHaveBeenCalled();
  });

  it.each([null, "", "https://malicious-site.com"])(
    "should replace to home once when the stored URL is %p and there is no fallback",
    async (saved) => {
      mockGetItem.mockReturnValue(saved);

      await renderLoginPage();

      expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it("prefers the session storage URL over the fallback cookie, and clears the cookie", async () => {
    mockGetItem.mockReturnValue("/newsletter");
    mockGetLoginRedirectFallback.mockResolvedValue("/workspace?utm_source=x");

    await renderLoginPage();

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/newsletter");
    expect(mockClearFallbackAction).toHaveBeenCalledTimes(1);
  });

  it("falls back to the cookie destination when session storage is empty, and clears the cookie", async () => {
    mockGetItem.mockReturnValue(null);
    mockGetLoginRedirectFallback.mockResolvedValue("/workspace?utm_source=x");

    await renderLoginPage();

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/workspace?utm_source=x");
    expect(mockClearFallbackAction).toHaveBeenCalledTimes(1);
  });

  it("re-validates the fallback cookie and replaces to home when it is unsafe", async () => {
    mockGetItem.mockReturnValue(null);
    mockGetLoginRedirectFallback.mockResolvedValue("//evil.com");

    await renderLoginPage();

    expect(mockReplace).toHaveBeenCalledWith("/");
    expect(mockClearFallbackAction).toHaveBeenCalledTimes(1);
  });

  it("should flag the PIV error when returning with pivError", async () => {
    mockGetItem.mockReturnValue("/newsletter");
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ pivError: "true" }),
    );

    await renderLoginPage();

    expect(mockSetItem).toHaveBeenCalledWith("showPivError", "true");
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/newsletter");
  });

  it("should display 'Redirecting...' text", async () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = await renderLoginPage();

    expect(container).toHaveTextContent("Redirecting...");
  });
});
