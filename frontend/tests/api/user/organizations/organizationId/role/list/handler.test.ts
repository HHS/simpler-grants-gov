/**
 * @jest-environment node
 */

import { getOrganizationRolesHandler } from "src/app/api/user/organizations/[organizationId]/roles/list/handler";
import { UnauthorizedError } from "src/errors";
import type { UserRole } from "src/types/userTypes";

import { NextRequest } from "next/server";

type Params = { organizationId: string };

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
const getOrganizationRolesMock = jest.fn<
  Promise<UserRole[]>,
  [string, string]
>();

jest.mock("src/services/auth/session", () => ({
  getSession: () => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  getOrganizationRoles: (token: string, orgId: string) =>
    getOrganizationRolesMock(token, orgId),
}));

describe("user/organizations/[organizationId]/roles/list handler", () => {
  const params: Params = { organizationId: "org-123" };

  beforeEach(() => {
    getSessionMock.mockResolvedValue({ token: "a-token", user_id: "u-1" });
    getOrganizationRolesMock.mockResolvedValue([
      { role_id: "r1", role_name: "Admin", privileges: [] },
      { role_id: "r2", role_name: "Member", privileges: [] },
    ]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns 200 with roles on GET", async () => {
    const req = makeRequest("GET");
    const res = await getOrganizationRolesHandler(req, {
      params: Promise.resolve(params),
    });

    expect(getOrganizationRolesMock).toHaveBeenCalledWith("a-token", "org-123");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: UserRole[] };
    expect(json.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role_id: "r1", role_name: "Admin" }),
        expect.objectContaining({ role_id: "r2", role_name: "Member" }),
      ]),
    );
  });

  it("also returns 200 with roles on POST", async () => {
    const req = makeRequest("POST");
    const res = await getOrganizationRolesHandler(req, {
      params: Promise.resolve(params),
    });

    expect(getOrganizationRolesMock).toHaveBeenCalledWith("a-token", "org-123");
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: UserRole[] };
    expect(json.data).toHaveLength(2);
  });

  it("throws UnauthorizedError when unauthenticated", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const req = makeRequest("GET");
    await expect(
      getOrganizationRolesHandler(req, { params: Promise.resolve(params) }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns 500 when fetcher rejects", async () => {
    getOrganizationRolesMock.mockRejectedValueOnce(new Error("boom"));
    const req = makeRequest("GET");
    const res = await getOrganizationRolesHandler(req, {
      params: Promise.resolve(params),
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { message: string };
    expect(typeof body.message).toBe("string");
  });
});
