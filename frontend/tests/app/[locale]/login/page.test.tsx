import { render } from "@testing-library/react";
import LoginPage from "src/app/[locale]/login/page";
import SessionStorage from "src/services/auth/sessionStorage";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import * as React from "react";

const mockPush = jest.fn();

jest.mock("react", () => {
  const actualModule = jest.requireActual<typeof React>("react");
  return {
    ...actualModule,
    useEffect: (callback: () => void) => {
      callback();
    },
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockGetItem = jest.spyOn(SessionStorage, "getItem");
const mockRemoveItem = jest.spyOn(SessionStorage, "removeItem");
const mockConsoleError = jest.spyOn(console, "error");

const createMockRouter = (props = {}) => ({
  back: jest.fn(),
  forward: jest.fn(),
  push: mockPush,
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  ...props,
});

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const windowMock = {
      location: {
        pathname: "/",
      },
    };
    Object.defineProperty(global, "window", {
      value: windowMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <AppRouterContext.Provider value={createMockRouter()}>
        {ui}
      </AppRouterContext.Provider>,
    );
  };

  it("should redirect to stored URL from session storage", () => {
    mockGetItem.mockReturnValue("/test-redirect-path");

    renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/test-redirect-path");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should redirect to home if no redirect URL is stored", () => {
    mockGetItem.mockReturnValue(null);

    renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    // 2 times because of the redirect to home
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should redirect to home if redirect URL is empty", () => {
    mockGetItem.mockReturnValue("");

    renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    // 2 times because of the redirect to home
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should redirect to home if redirect URL doesn't start with /", () => {
    mockGetItem.mockReturnValue("https://malicious-site.com");

    renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    // 2 times because of the redirect to home
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should display 'Redirecting...' text", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(container).toHaveTextContent("Redirecting...");
  });

  it("should log error when window is undefined", () => {
    const originalWindow = global.window;
    delete (global as { window?: Window }).window;

    try {
      if (typeof window === "undefined") {
        console.error("window is undefined");
      }

      expect(mockConsoleError).toHaveBeenCalledWith("window is undefined");
      expect(mockPush).not.toHaveBeenCalled();
    } finally {
      (global as { window?: Window }).window = originalWindow;
    }
  });
});
