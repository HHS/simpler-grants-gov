/**
 * @jest-environment node
 */

import { POST } from "src/app/api/auth/logout/route";

const getSessionMock = jest.fn();
const deleteSessionMock = jest.fn();
const postLogoutMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/services/auth/sessionUtils", () => ({
  deleteSession: (): unknown => deleteSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/userFetcher", () => ({
  postLogout: (token: string): unknown => postLogoutMock(token),
}));

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("/api/auth/logout POST handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("errors if there is no current session token", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));
    const response = await POST();

    expect(postLogoutMock).toHaveBeenCalledTimes(0);
    expect(response.status).toEqual(401);
    const json = (await response.json()) as { message: string };
    expect(json.message).toEqual(
      'Error logging out: {"type":"UnauthorizedError","searchInputs":{},"message":"No active session to logout","status":401,"details":{}}',
    );
  });
  it("calls postLogout with token from session", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    await POST();

    expect(postLogoutMock).toHaveBeenCalledTimes(1);
    expect(postLogoutMock).toHaveBeenCalledWith("fakeToken");
  });
  it("errors if API logout call errors", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    postLogoutMock.mockImplementation(() => {
      throw new Error("the API threw this error");
    });
    const response = await POST();

    expect(postLogoutMock).toHaveBeenCalledTimes(1);
    expect(postLogoutMock).toHaveBeenCalledWith("fakeToken");
    expect(response.status).toEqual(500);
    const json = (await response.json()) as { message: string };
    expect(json.message).toEqual("Error logging out: the API threw this error");
  });

  it("errors if API logout call returns nothing", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    postLogoutMock.mockImplementation(() => null);
    const response = await POST();

    expect(postLogoutMock).toHaveBeenCalledTimes(1);
    expect(postLogoutMock).toHaveBeenCalledWith("fakeToken");
    expect(response.status).toEqual(400);
    const json = (await response.json()) as { message: string };
    // const message = JSON.parse(json) as FrontendErrorDetails;
    expect(json.message).toEqual(
      'Error logging out: {"type":"APIRequestError","searchInputs":{},"message":"No logout response from API","status":400,"details":{}}',
    );
  });
  it("calls deleteSession", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    postLogoutMock.mockImplementation(() => "success");
    await POST();

    expect(deleteSessionMock).toHaveBeenCalledTimes(1);
  });
  it("returns sucess message on success", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    postLogoutMock.mockImplementation(() => "success");
    const response = await POST();

    expect(response.status).toEqual(200);
    const json = (await response.json()) as { message: string };
    expect(json.message).toEqual("logout success");
  });
});
