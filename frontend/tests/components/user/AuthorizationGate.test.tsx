import { ApiRequestError } from "src/errors";
import { useFetchedResources } from "src/hooks/useFetchedResources";
import { fakeUserPrivilegesResponse } from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import { render, screen } from "tests/react-utils";

import { JSX } from "react";

import { AuthorizationGate } from "src/components/user/AuthorizationGate";

const mockGetSession = jest.fn();
const mockOnUnauthorized = jest.fn();
const mockOnUnauthenticated = jest.fn();
const mockGetUserPrivileges = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("next-intl", () => ({
  ...jest.requireActual<typeof import("next-intl")>("next-intl"),
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  getUserPrivileges: () => mockGetUserPrivileges() as unknown,
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
  it("runs onUnauthorized handler if any resource promises resolve with a 403 status code", async () => {
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
  it("handles non auth related errors in any resource fetches", async () => {
    const fakeError = new ApiRequestError(
      "fake application errors",
      "application error",
      500,
    );
    const mockOnError = jest.fn();
    const component = await AuthorizationGate({
      children: <div>HELLO</div>,
      onUnauthorized: mockOnUnauthorized,
      onError: mockOnError,
      resourcePromises: {
        firstResource: new Promise((_resolve, reject) => reject(fakeError)),
      },
    });
    render(component as JSX.Element);
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledTimes(1);
    expect(mockOnError).toHaveBeenCalledWith(fakeError);
  });
  it("runs onUnauthorized handler if any passed permissions are not satisfied by fetched user permissions", async () => {
    mockGetUserPrivileges.mockResolvedValue(fakeUserPrivilegesResponse);
    const component = await AuthorizationGate({
      children: <div>HELLO</div>,
      onUnauthorized: mockOnUnauthorized,
      requiredPrivileges: [
        {
          resourceId: "2",
          resourceType: "application",
          privilege: "modify_application",
        },
      ],
    });
    render(component as JSX.Element);
    expect(mockOnUnauthorized).toHaveBeenCalledTimes(1);
  });
  it("renders children when all resource promises return with 200s and passes down all fetched resources via provider as expected", async () => {
    const ProviderTester = () => {
      const resources = useFetchedResources();
      return Object.entries(resources).map(([resourceKey, resourceValue]) => (
        <>
          <div>{resourceKey}</div>
          <div>{resourceValue as string}</div>
        </>
      ));
    };
    const component = await AuthorizationGate({
      children: <ProviderTester />,
      onUnauthorized: mockOnUnauthorized,
      resourcePromises: {
        firstResource: Promise.resolve("some resolved value"),
      },
    });
    render(component as JSX.Element);
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(screen.getByText("firstResource")).toBeInTheDocument();
    expect(screen.getByText("some resolved value")).toBeInTheDocument();
  });
  it("renders children when all passed permissions are satisfied", async () => {
    mockGetUserPrivileges.mockResolvedValue(fakeUserPrivilegesResponse);
    const component = await AuthorizationGate({
      children: <div>HELLO</div>,
      onUnauthorized: mockOnUnauthorized,
      requiredPrivileges: [
        {
          resourceId: "1",
          resourceType: "organization",
          privilege: "modify_organization",
        },
        {
          resourceId: "2",
          resourceType: "application",
          privilege: "read_application",
        },
      ],
    });
    render(component as JSX.Element);
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(screen.getByText("HELLO")).toBeInTheDocument();
  });
});
