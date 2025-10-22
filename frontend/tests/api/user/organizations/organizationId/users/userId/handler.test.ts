/**
 * @jest-environment node
 */

import { updateOrganizationUserHandler } from "src/app/api/user/organizations/[organizationId]/users/[userId]/handler";
import { UnauthorizedError } from "src/errors";
import type { UserDetail } from "src/types/userTypes";

import { NextRequest } from "next/server";

type Params = { organizationId: string; userId: string };

function makeRequest(
  method: "GET" | "POST" | "PUT",
  body?: unknown,
): NextRequest {
  const init: RequestInit = {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };

  const webReq = new Request("http://test.local/api", init);
  return new NextRequest(webReq);
}

const getSessionMock = jest.fn<
  Promise<{ token: string; user_id: string } | null>,
  []
>();
const updateOrganizationUserRolesMock = jest.fn<
  Promise<UserDetail>,
  [string, string, string, string[]]
>();

jest.mock("src/services/auth/session", () => ({
  getSession: () => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  updateOrganizationUserRoles: (
    token: string,
    orgId: string,
    userId: string,
    roleIds: string[],
  ) => updateOrganizationUserRolesMock(token, orgId, userId, roleIds),
}));

describe("user/organizations/[organizationId]/users/[userId] handler", () => {
  const params: Params = { organizationId: "org-777", userId: "user-999" };
  const role_ids = ["r-1", "r-2"];

  beforeEach(() => {
    getSessionMock.mockResolvedValue({ token: "a-token", user_id: "u-1" });
    updateOrganizationUserRolesMock.mockResolvedValue({
      user_id: params.userId,
      email: "x@y.com",
      first_name: "X",
      last_name: "Y",
      roles: role_ids.map((id) => ({ role_id: id, role_name: "Role" })),
    } as UserDetail);
  });

  afterEach(() => jest.resetAllMocks());

  it("returns 200 and updated user on success", async () => {
    const req = makeRequest("PUT", { role_ids });
    const res = await updateOrganizationUserHandler(req, {
      params: Promise.resolve(params),
    });
    expect(updateOrganizationUserRolesMock).toHaveBeenCalledWith(
      "a-token",
      "org-777",
      "user-999",
      role_ids,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: UserDetail };
    expect(json.data.user_id).toBe("user-999");
    expect(json.data.roles?.map((r) => r.role_id)).toEqual(role_ids);
  });

  it("throws UnauthorizedError when unauthenticated", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const req = makeRequest("PUT", { role_ids });
    await expect(
      updateOrganizationUserHandler(req, { params: Promise.resolve(params) }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns 500 when fetcher rejects", async () => {
    updateOrganizationUserRolesMock.mockRejectedValueOnce(new Error("boom"));
    const req = makeRequest("PUT", { role_ids });
    const res = await updateOrganizationUserHandler(req, {
      params: Promise.resolve(params),
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { message: string };
    expect(typeof body.message).toBe("string");
  });
});
