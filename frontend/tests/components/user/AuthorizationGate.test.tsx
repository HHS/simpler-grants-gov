import { ApiRequestError } from "src/errors";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import { render, screen } from "tests/react-utils";

import { JSX } from "react";

import { AuthorizationGate } from "src/components/user/AuthorizationGate";

const mockGetSession = jest.fn();
const mockOnUnauthorized = jest.fn();
const mockOnUnauthenticated = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("next-intl", () => ({
  ...jest.requireActual<typeof import("next-intl")>("next-intl"),
  useTranslations: () => useTranslationsMock(),
}));

describe("AuthorizationGate", () => {
  beforeEach(() => {
    mockGetSession.mockReturnValue({ token: "a token" });
  });
  afterEach(() => jest.clearAllMocks());

  it("runs onUnauthorized handler if not logged in", async () => {
    mockGetSession.mockReturnValue({ token: undefined });
    const component = await AuthorizationGate({
      children: <div>HELLO</div>,
      onUnauthorized: mockOnUnauthorized,
      onUnauthenticated: mockOnUnauthenticated,
    });
    render(component as JSX.Element);
    expect(screen.queryByText("HELLO")).not.toBeInTheDocument();
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(mockOnUnauthenticated).toHaveBeenCalled();
  });
  it.only("runs onUnauthorized handler if any resource promises resolve with a 401 or 403 status code", async () => {
    const component = await AuthorizationGate({
      children: <div>HELLO</div>,
      onUnauthorized: mockOnUnauthorized,
      resourcePromises: {
        firstResource: Promise.reject(
          new ApiRequestError(
            "fake unauthorized error",
            "APIRequestError",
            403,
          ),
        ),
      },
    });
    render(component as JSX.Element);
    expect(mockOnUnauthorized).toHaveBeenCalledTimes(1);
  });
  // it("handles non auth related errors in any resource fetches", async () => {
  //   const component = await AuthorizationGate({
  //     children: <div>HELLO</div>,
  //     onUnauthorized: mockOnUnauthorized,
  //     resourcePromises: {
  //       firstResource: new Promise((_resolve, reject) =>
  //         reject(
  //           new ApiRequestError(
  //             "fake unauthorized error",
  //             "APIRequestError",
  //             403,
  //           ),
  //         ),
  //       ),
  //     },
  //   });
  //   render(component as JSX.Element);
  //   expect(mockOnUnauthorized).toHaveBeenCalledTimes(1);
  // });
  // it("runs onUnauthorized handler if any passed permissions are not satisfied by fetched user permissions", async () => {});
  // it("effectively runs an onUnauthorized handler to redirect", async () => {});
  // it("effectively runs an onUnauthorized handler to render a new component", async () => {});
  // it("effectively runs an onUnauthorized handler to render an existing child component with new props", async () => {});
  // it("renders children when all resource promises return with 200s and passes down all fetched resources as expected", async () => {
  //   const component = await AuthorizationGate({
  //     children: <div>HELLO</div>,
  //     onUnauthorized: mockOnUnauthorized,
  //     resourcePromises: {
  //       firstResource: new Promise((_resolve, reject) =>
  //         reject(
  //           new ApiRequestError(
  //             "fake unauthorized error",
  //             "APIRequestError",
  //             403,
  //           ),
  //         ),
  //       ),
  //     },
  //   });
  //   render(component as JSX.Element);
  //   expect(mockOnUnauthorized).toHaveBeenCalledTimes(1);
  // });
  // it("renders children when all passed permissions are satisfied", async () => {});
});
