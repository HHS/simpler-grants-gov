/**
 * @jest-environment node
 */

import { GET } from "src/app/api/auth/callback/route";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const createSessionMock = jest.fn();
const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  createSession: (token: string): unknown => createSessionMock(token),
  getSession: (): unknown => getSessionMock(),
}));

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("GET request", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls createSession with token set in header", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(new NextRequest("https://simpler.grants.gov")),
    );

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(createSessionMock).toHaveBeenCalledWith("fakeToken");
    expect(redirectError.digest).toContain("message=already logged in");
  });

  it("if no token exists on current session, calls createSession with token set in query param", async () => {
    getSessionMock.mockImplementation(() => ({}));
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(new NextRequest("https://simpler.grants.gov?token=queryFakeToken")),
    );

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(createSessionMock).toHaveBeenCalledWith("queryFakeToken");
    expect(redirectError.digest).toContain("message=created session");
  });

  it("if no token exists on current session or query param, does not call createSession", async () => {
    getSessionMock.mockImplementation(() => ({}));
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(new NextRequest("https://simpler.grants.gov")),
    );
    expect(createSessionMock).toHaveBeenCalledTimes(0);
    expect(redirectError.digest).toContain("message=no token provided");
  });
});
