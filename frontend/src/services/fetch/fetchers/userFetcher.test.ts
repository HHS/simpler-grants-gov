import { updateUserInvitation } from "src/services/fetch/fetchers/userFetcher";
import { fakeOrganizationInvitation } from "src/utils/testing/fixtures";

const fetchUserMock = jest.fn();
const fetchUserWithMethodMock = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: (type: string) =>
    fetchUserWithMethodMock(type) as unknown,
}));

describe("updateUserInvitation", () => {
  afterEach(() => jest.resetAllMocks());

  it("posts the accepted status to the invitation subpath and returns the data", async () => {
    fetchUserMock.mockReturnValue({
      json: () => ({ data: fakeOrganizationInvitation }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    const result = await updateUserInvitation("1", "2", "accepted");

    expect(result).toEqual(fakeOrganizationInvitation);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/invitations/2/organizations",
      body: { status: "accepted" },
    });
  });

  it("passes through the rejected status", async () => {
    fetchUserMock.mockReturnValue({
      json: () => ({ data: fakeOrganizationInvitation }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    await updateUserInvitation("1", "2", "rejected");

    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/invitations/2/organizations",
      body: { status: "rejected" },
    });
  });
});
