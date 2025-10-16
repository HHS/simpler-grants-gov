/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ApiRequestError } from "src/errors";
import { useAuthorizedData } from "src/hooks/useAuthorizedData";
import { AuthorizedData } from "src/types/authTypes";
import { UserPrivilegeDefinition } from "src/types/userTypes";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import { render, screen } from "tests/react-utils";

import { JSX } from "react";

import { AuthorizationGate } from "src/components/user/AuthorizationGate";

const PropTester = ({
  authorizedData,
}: {
  authorizedData?: AuthorizedData;
}) => {
  return (
    <>
      <div>
        fetchedResources
        {Object.entries(authorizedData!.fetchedResources).map(
          ([resourceKey, resourceValue]) => (
            <div key={resourceKey}>
              <div>{resourceKey}</div>
              <div>{resourceValue.data as string}</div>
            </div>
          ),
        )}
      </div>
      <div>
        requiredPermissions
        {authorizedData!.confirmedPrivileges.map((permission) => (
          <div key={`${permission.privilege}-${permission.resourceType}`}>
            <div>
              {permission.privilege} : {permission.authorized.toString()}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const mockGetSession = jest.fn();
const mockOnUnauthorized = jest.fn();
const mockOnUnauthenticated = jest.fn();
const mockCheckUserPrivilege = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("next-intl", () => ({
  ...jest.requireActual<typeof import("next-intl")>("next-intl"),
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  checkUserPrivilege: (
    _token: string,
    _userId: string,
    privilegeDefinition: UserPrivilegeDefinition,
  ) => mockCheckUserPrivilege(privilegeDefinition) as unknown,
}));

describe("AuthorizationGate", () => {
  beforeEach(() => {
    mockGetSession.mockReturnValue({ token: "a token" });
  });
  afterEach(() => jest.clearAllMocks());

  it("runs onUnauthenticated handler if not logged in", async () => {
    mockGetSession.mockReturnValue({ token: undefined });
    const component = await AuthorizationGate({
      requiredPrivileges: [
        {
          resourceId: "1",
          resourceType: "application",
          privilege: "view_application",
        },
      ],
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
    const child = <div>HELLO</div>;
    const component = await AuthorizationGate({
      children: child,
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
    expect(mockOnUnauthorized).toHaveBeenCalledWith(child, {
      firstResource: { statusCode: 403, error: "fake unauthorized error" },
    });
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
  it("passes down all fetched resources via provider", async () => {
    const ProviderTester = () => {
      const resources = useAuthorizedData();
      return (
        <div>
          fetchedResources
          {Object.entries(resources.fetchedResources).map(
            ([resourceKey, resourceValue]) => (
              <div key={resourceKey}>
                <div>{resourceKey}</div>
                <div>{resourceValue.data as string}</div>
              </div>
            ),
          )}
        </div>
      );
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
  it("passes down all fetched permission check results via provider", async () => {
    mockCheckUserPrivilege.mockImplementation(
      (privilegeDefinition: UserPrivilegeDefinition) => {
        if (privilegeDefinition.resourceId === "1") {
          return Promise.resolve([]);
        }
        return Promise.reject(new ApiRequestError("", "", 403));
      },
    );
    const ProviderTester = () => {
      const resources = useAuthorizedData();
      return (
        <div>
          requiredPermissions
          {resources.confirmedPrivileges.map((permission) => (
            <div key={`${permission.privilege}-${permission.resourceType}`}>
              <div>
                {permission.privilege} : {permission.authorized.toString()}
              </div>
            </div>
          ))}
        </div>
      );
    };
    const component = await AuthorizationGate({
      children: <ProviderTester />,
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
    expect(screen.getByText("modify_organization : true")).toBeInTheDocument();
    expect(screen.getByText("read_application : false")).toBeInTheDocument();
  });
  it("passes fetched resources and privilege check results as prop to top level child", async () => {
    mockCheckUserPrivilege.mockImplementation(
      (privilegeDefinition: UserPrivilegeDefinition) => {
        if (privilegeDefinition.resourceId === "1") {
          return Promise.resolve([]);
        }
        return Promise.reject(new ApiRequestError("", "", 403));
      },
    );
    const component = await AuthorizationGate({
      children: <PropTester />,
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
    expect(screen.getByText("modify_organization : true")).toBeInTheDocument();
    expect(screen.getByText("read_application : false")).toBeInTheDocument();
  });
});
