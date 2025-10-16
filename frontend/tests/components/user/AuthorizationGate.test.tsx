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
const mockCheckUserPrivilege = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

jest.mock("next-intl", () => ({
  ...jest.requireActual<typeof import("next-intl")>("next-intl"),
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  checkUserPrivilege: () => mockCheckUserPrivilege() as unknown,
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
  it("renders children when all resource promises return with 200s and passes down all fetched resources via provider as expected", async () => {
    const ProviderTester = () => {
      const resources = useFetchedResources();
      return (
        <div>
          fetchedResources
          {Object.entries(resources.fetchedResources).map(
            ([resourceKey, resourceValue]) => (
              <div key={resourceKey}>
                <div>{resourceKey}</div>
                <div>{resourceValue.data}</div>
              </div>
            ),
          )}
        </div>
      );

      // return Object.entries(resources).map(([dataType, dataValue]) => (
      //   <div key={dataType}>
      //     <div>{dataType}</div>
      //     <div>
      //       {Object.entries(dataValue).map(([resourceKey, resourceValue]) => (
      //         <>
      //           <div key={resourceKey}>{resourceKey}</div>
      //           <div>{resourceValue.data || resourceValue.authorized}</div>
      //         </>
      //       ))}
      //     </div>
      //   </div>
      // ));
    };
    const component = await AuthorizationGate({
      children: <ProviderTester />,
      onUnauthorized: mockOnUnauthorized,
      resourcePromises: {
        firstResource: Promise.resolve("some resolved value"),
      },
      // requiredPrivileges: [
      //   {
      //     resourceType: "application",
      //     resourceId: "1",
      //     privilege: "view_application",
      //   },
      // ],
    });
    render(component as JSX.Element);
    expect(mockOnUnauthorized).not.toHaveBeenCalled();
    expect(screen.getByText("firstResource")).toBeInTheDocument();
    expect(screen.getByText("some resolved value")).toBeInTheDocument();
  });
  it.only("renders children and passes down all fetched permission check results via provider as expected", async () => {
    mockCheckUserPrivilege.mockResolvedValue([]);
    const ProviderTester = () => {
      const resources = useFetchedResources();
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
    expect(screen.getByText("read_application : true")).toBeInTheDocument();
  });
});
