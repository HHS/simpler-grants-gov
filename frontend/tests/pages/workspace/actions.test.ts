import { identity } from "lodash";
import { inviteUserAction } from "src/app/[locale]/(base)/user/workspace/actions";

const getSessionMock = jest.fn();
const mockCreateInvitation = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("src/services/fetch/fetchers/organizationsFetcher", () => ({
  inviteUserToOrganization: (token: unknown, data: unknown) =>
    mockCreateInvitation(token, data) as unknown,
}));

describe("user profile form action", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("returns validation warning if email is missing", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    const inviteFormData = new FormData();
    inviteFormData.append("role", "populated");
    const result = await inviteUserAction(null, inviteFormData, "1");
    expect(result.validationErrors).toEqual({
      email: ["Expected string, received null"],
    });
  });
  it("returns validation warning if last name is missing", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    const inviteFormData = new FormData();
    inviteFormData.append("email", "populated");
    const result = await inviteUserAction(null, inviteFormData, "1");
    expect(result.validationErrors).toEqual({
      role: ["Expected string, received null"],
    });
  });
  it("returns error if not logged in", async () => {
    getSessionMock.mockResolvedValue({ token: null });
    const inviteFormData = new FormData();
    const result = await inviteUserAction(null, inviteFormData, "1");
    expect(result.errorMessage).toEqual("Not logged in");
  });
  it("returns result of update on success", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    mockCreateInvitation.mockImplementation((_token, data) => {
      return data as unknown;
    });

    const inviteFormData = new FormData();
    inviteFormData.append("email", "an email");
    inviteFormData.append("role", "smith");

    const result = await inviteUserAction(null, inviteFormData, "1");
    expect(result.data).toEqual({
      email: "an email",
      roleIds: ["smith"],
      organizationId: "1",
    });
  });
  it("returns API error when applicable", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    mockCreateInvitation.mockRejectedValue(new Error("fake error"));

    const inviteFormData = new FormData();
    inviteFormData.append("email", "an email");
    inviteFormData.append("role", "smith");

    const result = await inviteUserAction(null, inviteFormData, "1");
    expect(result.errorMessage).toEqual("fake error");
  });
});
