import { UnauthorizedError } from "src/errors";
import {
  getOrganizationDetails,
  getOrganizationPendingInvitations,
  getOrganizationRoles,
  getOrganizationUsers,
  getUserOrganizations,
  inviteUserToOrganization,
  removeOrganizationUser,
  updateOrganizationUserRoles,
} from "src/services/fetch/fetchers/organizationsFetcher";
import { OrganizationInvitationStatus } from "src/types/userTypes";

type FetchArgs = {
  subPath: string;
  additionalHeaders: Record<string, string>;
  body?: unknown;
};

type FetchImpl = (args: FetchArgs) => { json: () => unknown };

type FetchWithMethodFn = (type: string) => FetchImpl;

const fetchOrganizationMock = jest.fn<ReturnType<FetchImpl>, [FetchArgs]>();
const fetchOrganizationWithMethodMock = jest.fn<FetchImpl, [string]>();

const fetchUserMock = jest.fn<ReturnType<FetchImpl>, [FetchArgs]>();
const fetchUserWithMethodMock = jest.fn<FetchImpl, [string]>();

type GetSessionFn = () => Promise<unknown>;

const mockGetSession = jest.fn<ReturnType<GetSessionFn>, []>();

jest.mock("src/services/fetch/fetchers/fetchers", () => {
  const mocked: {
    fetchOrganizationWithMethod: FetchWithMethodFn;
    fetchUserWithMethod: FetchWithMethodFn;
  } = {
    fetchOrganizationWithMethod: (type: string) =>
      fetchOrganizationWithMethodMock(type),
    fetchUserWithMethod: (type: string) => fetchUserWithMethodMock(type),
  };
  return mocked;
});

jest.mock("src/services/auth/session", () => {
  const mocked: { getSession: GetSessionFn } = {
    getSession: () => mockGetSession(),
  };
  return mocked;
});

describe("getOrganizationDetails", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchOrganizationWithMethod as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });
    fetchOrganizationMock.mockReturnValue({
      json: () => ({ data: { fake: "org" } }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await getOrganizationDetails("org-123");

    expect(result).toEqual({ fake: "org" });
    expect(fetchOrganizationWithMethodMock).toHaveBeenCalledWith("GET");
    expect(fetchOrganizationMock).toHaveBeenCalledWith({
      subPath: "org-123",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
    });
  });

  it("throws UnauthorizedError when session is missing or has no token", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getOrganizationDetails("org-123")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("getUserOrganizations", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [{ fake: "org" }] }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    const result = await getUserOrganizations("faketoken", "user-1");

    expect(result).toEqual([{ fake: "org" }]);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("GET");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "user-1/organizations",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
    });
  });
});

describe("getOrganizationUsers", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchOrganizationWithMethod as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });
    fetchOrganizationMock.mockReturnValue({
      json: () => ({ data: [{ fake: "user" }] }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await getOrganizationUsers("org-123");

    expect(result).toEqual([{ fake: "user" }]);
    expect(fetchOrganizationWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchOrganizationMock).toHaveBeenCalledWith({
      subPath: "org-123/users",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
    });
  });

  it("sorts returned users by email ascending and case-insensitive", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });
    fetchOrganizationMock.mockReturnValue({
      json: () => ({
        data: [
          { email: "zeta@example.com" },
          { email: "Alpha@example.com" },
          { email: "beta@example.com" },
        ],
      }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await getOrganizationUsers("org-123");

    expect(result).toEqual([
      { email: "Alpha@example.com" },
      { email: "beta@example.com" },
      { email: "zeta@example.com" },
    ]);
  });

  it("throws UnauthorizedError when session is missing or has no token", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getOrganizationUsers("org-123")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("getOrganizationRoles", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchOrganizationWithMethod as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });

    fetchOrganizationMock.mockReturnValue({
      json: () => ({ data: [{ fake: "role" }] }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await getOrganizationRoles("org-123");

    expect(result).toEqual([{ fake: "role" }]);
    expect(fetchOrganizationWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchOrganizationMock).toHaveBeenCalledWith({
      subPath: "org-123/roles/list",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
    });
  });

  it("throws UnauthorizedError when session is missing or has no token", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(getOrganizationRoles("org-123")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe("inviteUserToOrganization", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchOrganizationWithMethod as expected and returns json result", async () => {
    fetchOrganizationMock.mockReturnValue({
      json: () => ({ data: { fake: "invite-record" } }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await inviteUserToOrganization("faketoken", {
      organizationId: "org-123",
      roleId: ["role-1", "role-2"],
      email: "test@example.com",
    });

    expect(result).toEqual({ fake: "invite-record" });
    expect(fetchOrganizationWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchOrganizationMock).toHaveBeenCalledWith({
      subPath: "org-123/invitations",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
      body: {
        invitee_email: "test@example.com",
        role_ids: ["role-1", "role-2"],
      },
    });
  });
});

describe("getOrganizationPendingInvitations", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchOrganizationWithMethod as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });
    fetchOrganizationMock.mockReturnValue({
      json: () => ({ data: [{ fake: "pending-invite" }] }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await getOrganizationPendingInvitations("org-123");

    expect(result).toEqual([{ fake: "pending-invite" }]);
    expect(fetchOrganizationWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchOrganizationMock).toHaveBeenCalledWith({
      subPath: "org-123/invitations/list",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
      body: {
        filters: {
          status: {
            one_of: [OrganizationInvitationStatus.Pending],
          },
        },
      },
    });
  });

  it("sorts returned pending invitations by invitee_email ascending and case-insensitive", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });
    fetchOrganizationMock.mockReturnValue({
      json: () => ({
        data: [
          { invitee_email: "zeta@example.com" },
          { invitee_email: "Alpha@example.com" },
          { invitee_email: "beta@example.com" },
        ],
      }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await getOrganizationPendingInvitations("org-123");

    expect(result).toEqual([
      { invitee_email: "Alpha@example.com" },
      { invitee_email: "beta@example.com" },
      { invitee_email: "zeta@example.com" },
    ]);
  });

  it("throws UnauthorizedError when session is missing or has no token", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(
      getOrganizationPendingInvitations("org-123"),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("updateOrganizationUserRoles", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchOrganizationWithMethod as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });

    fetchOrganizationMock.mockReturnValue({
      json: () => ({ data: { fake: "updated-user" } }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await updateOrganizationUserRoles("org-123", "user-1", [
      "role-1",
      "role-2",
    ]);

    expect(result).toEqual({ fake: "updated-user" });
    expect(fetchOrganizationWithMethodMock).toHaveBeenCalledWith("PUT");
    expect(fetchOrganizationMock).toHaveBeenCalledWith({
      subPath: "org-123/users/user-1",
      additionalHeaders: {
        "X-SGG-TOKEN": "faketoken",
      },
      body: {
        role_ids: ["role-1", "role-2"],
      },
    });
  });

  it("throws UnauthorizedError when session is missing or has no token", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(
      updateOrganizationUserRoles("org-123", "user-1", ["role-1"]),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe("removeOrganizationUser", () => {
  afterEach(() => jest.resetAllMocks());

  it("calls fetchOrganizationWithMethod as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken" });

    fetchOrganizationMock.mockReturnValue({
      json: () => ({ data: { fake: "removed-user" } }),
    });
    fetchOrganizationWithMethodMock.mockReturnValue(fetchOrganizationMock);

    const result = await removeOrganizationUser("org-123", "user-1");

    expect(result).toEqual({ fake: "removed-user" });
    expect(fetchOrganizationWithMethodMock).toHaveBeenCalledWith("DELETE");
    expect(fetchOrganizationMock).toHaveBeenCalledWith({
      subPath: "org-123/users/user-1",
      additionalHeaders: {
        "X-SGG-TOKEN": "faketoken",
      },
    });
  });

  it("throws UnauthorizedError when session is missing or has no token", async () => {
    mockGetSession.mockResolvedValue(null);

    await expect(
      removeOrganizationUser("org-123", "user-1"),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
