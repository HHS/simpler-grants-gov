import {
  getOrganizationDetails,
  getOrganizationRoles,
  getOrganizationUsers,
  getUserOrganizations,
  updateOrganizationUserRoles,
} from "src/services/fetch/fetchers/organizationsFetcher";
import type { Organization } from "src/types/applicationResponseTypes";
import type { UserDetail, UserRole } from "src/types/userTypes";

type FetcherOptions = {
  subPath: string;
  additionalHeaders?: Record<string, string>;
  body?: unknown;
};
type JsonLike<T> = { json: () => Promise<T> };
type FetcherReturn<T> = Promise<JsonLike<T>>;

// Strongly typed mocks of the returned invoker
const mockFetchOrganizationWithMethod = jest.fn<
  FetcherReturn<unknown>,
  [string, FetcherOptions]
>();
const mockFetchUserWithMethod = jest.fn<
  FetcherReturn<unknown>,
  [string, FetcherOptions]
>();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchOrganizationWithMethod: (method: string) => {
    return (options: FetcherOptions) =>
      mockFetchOrganizationWithMethod(method, options);
  },
  fetchUserWithMethod: (method: string) => {
    return (options: FetcherOptions) =>
      mockFetchUserWithMethod(method, options);
  },
}));

function makeJson<T>(data: T): JsonLike<T> {
  return { json: () => Promise.resolve(data) };
}

afterEach(() => jest.clearAllMocks());

describe("getOrganizationDetails", () => {
  it("uses GET and returns organization data", async () => {
    const token = "token-xyz";
    const organizationId = "org-123";
    const data = { organization_id: organizationId } as Organization;

    mockFetchOrganizationWithMethod.mockResolvedValueOnce(
      makeJson<{ data: Organization }>({ data }),
    );

    const result = await getOrganizationDetails(token, organizationId);

    expect(mockFetchOrganizationWithMethod).toHaveBeenCalledTimes(1);
    const [method, options] = mockFetchOrganizationWithMethod.mock.calls[0];
    expect(method).toBe("GET");
    expect(options).toEqual({
      subPath: organizationId,
      additionalHeaders: { "X-SGG-Token": token },
    });
    expect(result).toBe(data);
  });
});

describe("getUserOrganizations", () => {
  it("uses GET and returns array of organizations", async () => {
    const token = "t";
    const userId = "u-1";
    const data = [{ organization_id: "o1" }] as Organization[];

    mockFetchUserWithMethod.mockResolvedValueOnce(
      makeJson<{ data: Organization[] }>({ data }),
    );

    const result = await getUserOrganizations(token, userId);

    expect(mockFetchUserWithMethod).toHaveBeenCalledTimes(1);
    const [method, options] = mockFetchUserWithMethod.mock.calls[0];
    expect(method).toBe("GET");
    expect(options).toEqual({
      subPath: `${userId}/organizations`,
      additionalHeaders: { "X-SGG-Token": token },
    });
    expect(result).toBe(data);
  });
});

describe("getOrganizationUsers", () => {
  it("uses POST and returns users", async () => {
    const token = "t";
    const organizationId = "org";
    const data = [{ user_id: "u1", roles: [] }] as unknown as UserDetail[];

    mockFetchOrganizationWithMethod.mockResolvedValueOnce(
      makeJson<{ data: UserDetail[] }>({ data }),
    );

    const result = await getOrganizationUsers(token, organizationId);

    expect(mockFetchOrganizationWithMethod).toHaveBeenCalledTimes(1);
    const [method, options] = mockFetchOrganizationWithMethod.mock.calls[0];
    expect(method).toBe("POST");
    expect(options).toEqual({
      subPath: `${organizationId}/users`,
      additionalHeaders: { "X-SGG-Token": token },
    });
    expect(result).toBe(data);
  });
});

describe("getOrganizationRoles", () => {
  it("uses POST and returns roles", async () => {
    const token = "t";
    const organizationId = "org";
    const data = [{ role_id: "r1", role_name: "Admin" }] as UserRole[];

    mockFetchOrganizationWithMethod.mockResolvedValueOnce(
      makeJson<{ data: UserRole[] }>({ data }),
    );

    const result = await getOrganizationRoles(token, organizationId);

    expect(mockFetchOrganizationWithMethod).toHaveBeenCalledTimes(1);
    const [method, options] = mockFetchOrganizationWithMethod.mock.calls[0];
    expect(method).toBe("POST");
    expect(options).toEqual({
      subPath: `${organizationId}/roles/list`,
      additionalHeaders: { "X-SGG-Token": token },
    });
    expect(result).toBe(data);
  });
});

describe("updateOrganizationUserRoles", () => {
  it("uses PUT with body and returns updated user", async () => {
    const token = "t";
    const organizationId = "org";
    const userId = "u1";
    const roleIds = ["r1", "r2"];
    const data = {
      user_id: userId,
      roles: roleIds.map((id) => ({ role_id: id, role_name: "Role" })),
    } as unknown as UserDetail;

    mockFetchOrganizationWithMethod.mockResolvedValueOnce(
      makeJson<{ data: UserDetail }>({ data }),
    );

    const result = await updateOrganizationUserRoles(
      token,
      organizationId,
      userId,
      roleIds,
    );

    expect(mockFetchOrganizationWithMethod).toHaveBeenCalledTimes(1);
    const [method, options] = mockFetchOrganizationWithMethod.mock.calls[0];
    expect(method).toBe("PUT");
    expect(options).toEqual({
      subPath: `${organizationId}/users/${userId}`,
      additionalHeaders: { "X-SGG-TOKEN": token },
      body: { role_ids: roleIds },
    });
    expect(result).toBe(data);
  });
});
