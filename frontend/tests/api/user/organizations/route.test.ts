/**
 * @jest-environment node
 */

import { getUserOrganizations } from "src/app/api/user/organizations/handler";
import { UserOrganization } from "src/types/userTypes";
import { fakeUserOrganization } from "src/utils/testing/fixtures";

const mockFetchOrganizations = jest.fn();
const getSessionMock = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: () => (opts: unknown) =>
    mockFetchOrganizations(opts) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

describe("user/organizations GET requests", () => {
  beforeEach(() => {
    mockFetchOrganizations.mockResolvedValue({
      json: () => Promise.resolve({ data: [fakeUserOrganization] }),
    });
    getSessionMock.mockReturnValue({ token: "a token", user_id: "1" });
  });
  afterEach(() => jest.resetAllMocks());
  it("calls opportunityDetails with expected arguments", async () => {
    await getUserOrganizations();
    expect(mockFetchOrganizations).toHaveBeenCalledWith({
      subPath: `1/organizations`,
      additionalHeaders: {
        "X-SGG-TOKEN": "a token",
      },
    });
  });

  it("returns a new response with competition data", async () => {
    const response = await getUserOrganizations();
    expect(response.status).toEqual(200);
    const body = (await response.json()) as UserOrganization[];
    expect(body).toEqual([fakeUserOrganization]);
  });

  it("returns a new response with with error if error on data fetch", async () => {
    mockFetchOrganizations.mockRejectedValue(new Error());
    const response = await getUserOrganizations();
    expect(response.status).toEqual(500);
  });
});
