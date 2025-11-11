import { identity } from "lodash";
import { userProfileAction } from "src/app/[locale]/(base)/user/account/actions";

const getSessionMock = jest.fn();
const mockUpdateUserDetails = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  updateUserDetails: (token: unknown, id: unknown, data: unknown) =>
    mockUpdateUserDetails(token, id, data) as unknown,
}));

describe("user profile form action", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("returns validation warning if last name is missing", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    const profileFormData = new FormData();
    profileFormData.append("firstName", "populated");
    const result = await userProfileAction(null, profileFormData);
    expect(result.validationErrors).toEqual({
      lastName: ["Expected string, received null"],
    });
  });
  it("returns validation warning if first name is missing", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    const profileFormData = new FormData();
    profileFormData.append("lastName", "populated");
    const result = await userProfileAction(null, profileFormData);
    expect(result.validationErrors).toEqual({
      firstName: ["Expected string, received null"],
    });
  });
  it("returns error if not logged in", async () => {
    getSessionMock.mockResolvedValue({ token: null });
    const profileFormData = new FormData();
    const result = await userProfileAction(null, profileFormData);
    expect(result.errorMessage).toEqual("Not logged in");
  });
  it("returns result of update on success", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    mockUpdateUserDetails.mockImplementation((_token, _id, data) => {
      return data as unknown;
    });

    const profileFormData = new FormData();
    profileFormData.append("firstName", "jones");
    profileFormData.append("middleName", "williams");
    profileFormData.append("lastName", "smith");

    const result = await userProfileAction(null, profileFormData);
    expect(result.data).toEqual({
      first_name: "jones",
      last_name: "smith",
      middle_name: "williams",
    });
  });
  it("returns API error when applicable", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    mockUpdateUserDetails.mockRejectedValue(new Error("fake error"));

    const profileFormData = new FormData();
    profileFormData.append("firstName", "jones");
    profileFormData.append("middleName", "williams");
    profileFormData.append("lastName", "smith");

    const result = await userProfileAction(null, profileFormData);
    expect(result.errorMessage).toEqual("fake error");
  });
});
