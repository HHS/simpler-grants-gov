import { render } from "@testing-library/react";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { StrictMode } from "react";

import { PostAuthRedirect } from "./PostAuthRedirect";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseSearchParams = jest.fn();
const mockRouter = { push: mockPush, replace: mockReplace };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

const mockPostUserEvent = jest.fn();

jest.mock("src/services/event/postUserEvent", () => ({
  postUserEvent: (event: unknown) => mockPostUserEvent(event) as unknown,
}));

const mockGetItem = jest.spyOn(SessionStorage, "getItem");
const mockSetItem = jest.spyOn(SessionStorage, "setItem");
const mockRemoveItem = jest.spyOn(SessionStorage, "removeItem");

describe("PostAuthRedirect", () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockGetItem.mockImplementation((key) => sessionStorage.getItem(key));
  });
  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("reads, clears, then replaces to the saved destination exactly once", () => {
    mockGetItem.mockReturnValue("/test-redirect-path");

    render(<PostAuthRedirect />);

    expect(mockGetItem).toHaveBeenCalledWith("login-redirect");
    expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
    expect(mockGetItem.mock.invocationCallOrder[0]).toBeLessThan(
      mockRemoveItem.mock.invocationCallOrder[0],
    );
    expect(mockRemoveItem.mock.invocationCallOrder[0]).toBeLessThan(
      mockReplace.mock.invocationCallOrder[0],
    );
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/test-redirect-path");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("preserves the full pathname and query", () => {
    mockGetItem.mockReturnValue("/search?query=test&utm_source=grants.gov");

    render(<PostAuthRedirect />);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(
      "/search?query=test&utm_source=grants.gov",
    );
  });

  it.each([null, "", "https://malicious-site.com", "//evil.com", "/api/foo"])(
    "replaces to / exactly once when the saved destination is %p",
    (saved) => {
      mockGetItem.mockReturnValue(saved);

      render(<PostAuthRedirect />);

      expect(mockRemoveItem).toHaveBeenCalledWith("login-redirect");
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith("/");
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it("navigates only once to the saved destination under Strict Mode", () => {
    sessionStorage.setItem("login-redirect", "/newsletter");

    render(
      <StrictMode>
        <PostAuthRedirect />
      </StrictMode>,
    );

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/newsletter");
    expect(mockPush).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("login-redirect")).toBeNull();
  });

  it("does not navigate again when re-rendered", () => {
    mockGetItem.mockReturnValue("/newsletter");

    const { rerender } = render(<PostAuthRedirect />);
    mockUseSearchParams.mockReturnValue(new URLSearchParams({ a: "b" }));
    rerender(<PostAuthRedirect />);

    expect(mockReplace).toHaveBeenCalledTimes(1);
  });

  it("should display 'Redirecting...' text", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = render(<PostAuthRedirect />);

    expect(container).toHaveTextContent("Redirecting...");
  });

  it("should display custom display text if supplied", () => {
    mockGetItem.mockReturnValue("/some-path");

    const { container } = render(
      <PostAuthRedirect displayMessage="custom..." />,
    );

    expect(container).toHaveTextContent("custom...");
  });

  it("should set pivError if specified and param received, and still replace once", () => {
    mockGetItem.mockReturnValue("/some-path");
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ pivError: "true" }),
    );
    render(<PostAuthRedirect displayMessage="custom..." checkPiv={true} />);

    expect(mockSetItem).toHaveBeenCalledWith("showPivError", "true");
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/some-path");
  });

  it("does not set pivError when checkPiv is not specified", () => {
    mockGetItem.mockReturnValue("/some-path");
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams({ pivError: "true" }),
    );
    render(<PostAuthRedirect />);

    expect(mockSetItem).not.toHaveBeenCalledWith("showPivError", "true");
  });

  describe("destination events", () => {
    it("reports a restored destination once under Strict Mode without the destination", () => {
      sessionStorage.setItem(
        "login-redirect",
        "/search?query=test&utm_source=grants.gov",
      );

      render(
        <StrictMode>
          <PostAuthRedirect trackDestination={true} />
        </StrictMode>,
      );

      expect(mockPostUserEvent).toHaveBeenCalledTimes(1);
      expect(mockPostUserEvent).toHaveBeenCalledWith({
        name: "destination_restored",
      });
    });

    it.each([
      [null, "missing"],
      ["", "missing"],
      ["https://malicious-site.com/steal", "invalid"],
      ["//evil.com/path", "invalid"],
      ["/api/auth/callback?token=secret", "invalid"],
    ])(
      "reports %p as rejected with reason %p and no destination",
      (saved, reason) => {
        mockGetItem.mockReturnValue(saved);

        render(<PostAuthRedirect trackDestination={true} />);

        expect(mockReplace).toHaveBeenCalledWith("/");
        expect(mockPostUserEvent).toHaveBeenCalledTimes(1);
        expect(mockPostUserEvent).toHaveBeenCalledWith({
          name: "destination_rejected",
          properties: { reason },
        });
        const sent = JSON.stringify(mockPostUserEvent.mock.calls);
        expect(sent).not.toContain("malicious");
        expect(sent).not.toContain("evil");
        expect(sent).not.toContain("secret");
      },
    );

    it("does not report destination events unless tracking is requested, as on /logout", () => {
      mockGetItem.mockReturnValue("/newsletter");

      render(<PostAuthRedirect />);

      expect(mockReplace).toHaveBeenCalledWith("/newsletter");
      expect(mockPostUserEvent).not.toHaveBeenCalled();
    });
  });
});
