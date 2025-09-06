import { render } from "@testing-library/react";
import LoginPage from "src/app/[locale]/(base)/login/page";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

import * as React from "react";

const mockPush = jest.fn();

jest.mock("react", () => {
  const actualModule = jest.requireActual<typeof React>("react");
  return {
    ...actualModule,
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockGetItem = jest.spyOn(SessionStorage, "getItem");
const mockRemoveItem = jest.spyOn(SessionStorage, "removeItem");

describe("Login Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect to stored URL from session storage", () => {
    mockGetItem.mockReturnValue("/test-redirect-path");

    render(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/test-redirect-path");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should redirect to home if no redirect URL is stored", () => {
    mockGetItem.mockReturnValue(null);

    render(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should redirect to home if redirect URL is empty", () => {
    mockGetItem.mockReturnValue("");

    render(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should redirect to home if redirect URL doesn't start with /", () => {
    mockGetItem.mockReturnValue("https://malicious-site.com");

    render(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should display 'Redirecting...' text", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = render(<LoginPage />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(container).toHaveTextContent("Redirecting...");
  });
});
