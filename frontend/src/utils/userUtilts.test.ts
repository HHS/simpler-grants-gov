import {
  fakeOrganizationDetailsResponse,
  fakeUserPrivilegesResponse,
} from "src/utils/testing/fixtures";
import { storeCurrentPage, userRoleForOrganization } from "src/utils/userUtils";

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

  it("should not store URL in session storage if pathname and search are empty", () => {
    storeCurrentPage("", "");
    expect(mockSetItem).not.toHaveBeenCalled();
  });
});
