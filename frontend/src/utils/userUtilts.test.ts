import {
  fakeOrganizationDetailsResponse,
  fakeUserPrivilegesResponse,
} from "src/utils/testing/fixtures";
import {
  getSafeLoginRedirect,
  isSafeLoginRedirect,
  storeCurrentPage,
  userRoleForOrganization,
} from "src/utils/userUtils";

const mockSetItem = jest.fn<void, [string, string]>();

jest.mock("src/services/sessionStorage/sessionStorage", () => {
  return {
    __esModule: true,
    default: {
      setItem: (key: string, value: string): void => mockSetItem(key, value),
    },
  };
});

describe("userRoleForOrganization", () => {
  it("returns empty string if no roles found for user and organization", () => {
    expect(
      userRoleForOrganization(
        fakeOrganizationDetailsResponse,
        fakeUserPrivilegesResponse,
      ),
    ).toEqual("");
  });
  it("returns first role name when only one role present", () => {
    expect(
      userRoleForOrganization(
        { ...fakeOrganizationDetailsResponse, organization_id: "4" },
        fakeUserPrivilegesResponse,
      ),
    ).toEqual("role_4");
  });
  it("returns comma separate list of roles", () => {
    expect(
      userRoleForOrganization(fakeOrganizationDetailsResponse, {
        ...fakeUserPrivilegesResponse,
        organization_users: [
          {
            organization: { organization_id: "great id" },
            organization_user_roles: [
              {
                role_id: "1",
                role_name: "role_1",
                privileges: ["view_application"],
              },
              {
                role_id: "2",
                role_name: "role_2",
                privileges: ["manage_org_members"],
              },
            ],
          },
        ],
      }),
    ).toEqual("role_1, role_2");
  });
});

describe("storeCurrentPage", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should store URL in session storage if pathname and search", () => {
    storeCurrentPage("path", "/search");
    expect(mockSetItem).toHaveBeenCalledWith("login-redirect", "path/search");
  });

  it("stores the full pathname and query", () => {
    storeCurrentPage("/search", "?query=test&utm_source=grants.gov");
    expect(mockSetItem).toHaveBeenCalledWith(
      "login-redirect",
      "/search?query=test&utm_source=grants.gov",
    );
  });

  it("replaces the saved destination when authentication is started again", () => {
    storeCurrentPage("/newsletter", "");
    storeCurrentPage("/workspace/applications", "");
    expect(mockSetItem).toHaveBeenCalledTimes(2);
    expect(mockSetItem).toHaveBeenLastCalledWith(
      "login-redirect",
      "/workspace/applications",
    );
  });

  it("should not store URL in session storage if pathname and search are empty", () => {
    storeCurrentPage("", "");
    expect(mockSetItem).not.toHaveBeenCalled();
  });
});

describe("isSafeLoginRedirect / getSafeLoginRedirect", () => {
  it.each([
    "/",
    "/newsletter",
    "/workspace/applications",
    "/search?query=test&status=forecasted",
    "/search?query=test&utm_source=grants.gov",
    "/es/search?query=test",
    "/apiary",
    "/developers/api-dashboard",
  ])("accepts %p unchanged", (destination) => {
    expect(isSafeLoginRedirect(destination)).toBe(true);
    expect(getSafeLoginRedirect(destination)).toBe(destination);
  });

  it.each([
    null,
    undefined,
    "",
    "newsletter",
    "https://example.com",
    "javascript:alert(1)",
    "//example.com",
    "///example.com",
    "/\\example.com",
    "/\\/example.com",
    "/foo\\bar",
    "/\t/example.com",
    "/new\nsletter",
    "/ search",
    "/search?query=%E0%A4%A",
    "/login",
    "/login/",
    "/login/callback",
    "/login?pivError=true",
    "/LOGIN",
    "/maintenance",
    "/unauthenticated",
    "/error",
    "/api",
    "/api/foo",
    "/api/auth/login",
    "/%61pi/foo",
    "/search/../api/foo",
    "/dev",
    "/dev/feature-flags",
  ])("rejects %p and falls back to /", (destination) => {
    expect(isSafeLoginRedirect(destination)).toBe(false);
    expect(getSafeLoginRedirect(destination)).toBe("/");
  });
});
