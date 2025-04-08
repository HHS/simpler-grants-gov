import { render } from "@testing-library/react";
import LoginPage from "src/app/[locale]/login/page";

import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";





const mockPush = jest.fn();
const mockGetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockSetItem = jest.fn();
const mockClear = jest.fn();

jest.doMock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.doMock("src/services/auth/sessionStorage", () => ({
  __esModule: true,
  default: {
    getItem: mockGetItem,
    removeItem: mockRemoveItem,
    setItem: mockSetItem,
    clear: mockClear,
    isSessionStorageAvailable: jest.fn().mockReturnValue(true),
  },
}));

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
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "window", {
      value: undefined,
      writable: true,
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
  });

  it("should redirect to home if no redirect URL is stored", () => {
    mockGetItem.mockReturnValue(null);

    renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should redirect to home if redirect URL is empty", () => {
    mockGetItem.mockReturnValue("");

    renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should redirect to home if redirect URL doesn't start with /", () => {
    mockGetItem.mockReturnValue("https://malicious-site.com");

    renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should display 'Redirecting...' text", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = renderWithRouter(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(container).toHaveTextContent("Redirecting...");
  });
});