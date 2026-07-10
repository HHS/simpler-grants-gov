/**
 * @jest-environment node
 */

import { getUserSession } from "src/app/api/auth/session/handler";

const getSessionMock = jest.fn();
const responseJsonMock = jest.fn((something: unknown) => something);

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (any: object) => responseJsonMock(any),
  },
}));

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("session GET request", () => {
  afterEach(() => jest.clearAllMocks());
  it("returns the current session token when one exists", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    await getUserSession();

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledWith({ token: "fakeToken" });
  });

  it("returns a resopnse with an empty token if no session token exists", async () => {
    getSessionMock.mockImplementation(() => null);
    await getUserSession();

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledWith({ token: "" });
  });
});
