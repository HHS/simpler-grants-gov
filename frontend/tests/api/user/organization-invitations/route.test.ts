/**
 * @jest-environment node
 */

import { updateOrganizationInvitation } from "src/app/api/user/organization-invitations/[organizationInvitationId]/handler";
import { OrganizationInvitation, UserOrganization } from "src/types/userTypes";
import {
  fakeOrganizationInvitation,
  fakeUserOrganization,
} from "src/utils/testing/fixtures";

const mockUpdateOrganizationInvitation = jest.fn();
const getSessionMock = jest.fn();

const mockRequest = (body: object) =>
  ({
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Request;

const mockParams = Promise.resolve({ organizationInvitationId: "2" });

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: () => (opts: unknown) =>
    mockUpdateOrganizationInvitation(opts) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

describe("user/organization-invitations POST requests", () => {
  beforeEach(() => {
    mockUpdateOrganizationInvitation.mockResolvedValue({
      json: () => Promise.resolve({ data: fakeOrganizationInvitation }),
    });
    getSessionMock.mockReturnValue({ token: "a token", user_id: "1" });
  });
  afterEach(() => jest.resetAllMocks());

  it("calls to update invitations with expected arguments", async () => {
    await updateOrganizationInvitation(mockRequest({ accepted: true }), {
      params: mockParams,
    });
    expect(mockUpdateOrganizationInvitation).toHaveBeenCalledWith({
      subPath: "1/invitations/2/organizations",
      additionalHeaders: {
        "X-SGG-TOKEN": "a token",
      },
      body: {
        status: "accepted",
      },
    });
  });

  it("calls to update invitations with expected arguments (rejection case)", async () => {
    await updateOrganizationInvitation(mockRequest({ accepted: false }), {
      params: mockParams,
    });
    expect(mockUpdateOrganizationInvitation).toHaveBeenCalledWith({
      subPath: "1/invitations/2/organizations",
      additionalHeaders: {
        "X-SGG-TOKEN": "a token",
      },
      body: {
        status: "rejected",
      },
    });
  });

  it("returns a new response with invitation data", async () => {
    const response = await updateOrganizationInvitation(
      mockRequest({ accepted: true }),
      {
        params: mockParams,
      },
    );
    expect(response.status).toEqual(200);
    const body = (await response.json()) as OrganizationInvitation;
    expect(body).toEqual(fakeOrganizationInvitation);
  });

  it("returns a new response with with error if error on data fetch", async () => {
    mockUpdateOrganizationInvitation.mockRejectedValue(new Error());
    const response = await updateOrganizationInvitation(
      mockRequest({ accepted: true }),
      {
        params: mockParams,
      },
    );
    expect(response.status).toEqual(500);
  });
});
