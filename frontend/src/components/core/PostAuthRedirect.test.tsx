import { render } from "@testing-library/react";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { PostAuthRedirect } from "./PostAuthRedirect";

const mockPush = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

const mockGetItem = jest.spyOn(SessionStorage, "getItem");
const mockSetItem = jest.spyOn(SessionStorage, "setItem");
const mockRemoveItem = jest.spyOn(SessionStorage, "removeItem");

describe("PostAuthRedirect", () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect to stored URL from session storage", () => {
    mockGetItem.mockReturnValue("/test-redirect-path");

    render(<PostAuthRedirect errorMessage="oops" />);

    expect(mockGetItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockPush).toHaveBeenCalledWith("/test-redirect-path");
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("should redirect to home if no redirect URL is stored", () => {
    mockGetItem.mockReturnValue(null);

    render(<PostAuthRedirect errorMessage="oops" />);

    expect(mockGetItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should redirect to home if redirect URL is empty", () => {
    mockGetItem.mockReturnValue("");

    render(<PostAuthRedirect errorMessage="oops" />);

    expect(mockGetItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should redirect to home if redirect URL doesn't start with /", () => {
    mockGetItem.mockReturnValue("https://malicious-site.com");

    render(<PostAuthRedirect errorMessage="oops" />);

    expect(mockGetItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it("should display 'Redirecting...' text", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = render(<PostAuthRedirect errorMessage="oops" />);

    expect(mockGetItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(container).toHaveTextContent("Redirecting...");
  });

  it("should display custom display text if supplied", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = render(
      <PostAuthRedirect errorMessage="oops" displayMessage="custom..." />,
    );

    expect(mockGetItem).toHaveBeenCalledWith("post-auth-redirect");
    expect(container).toHaveTextContent("custom...");
  });

  it("should set pivError if specified and param received", () => {
    mockGetItem.mockReturnValue("/some-path");
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ pivError: "true" }),
    );
    render(
      <PostAuthRedirect
        errorMessage="oops"
        displayMessage="custom..."
        checkPiv={true}
      />,
    );

    expect(mockSetItem).toHaveBeenCalledWith("showPivError", "true");
  });
});
