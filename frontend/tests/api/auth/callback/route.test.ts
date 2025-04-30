/**
 * @jest-environment node
 */

import { GET } from "src/app/api/auth/callback/route";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const createSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  createSession: (token: string): unknown => createSessionMock(token),
}));

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("/api/auth/callback GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls createSession on request with token in query params", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(new NextRequest("https://simpler.grants.gov/?token=fakeToken")),
    );

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(createSessionMock).toHaveBeenCalledWith("fakeToken");
    expect(redirectError.digest).toContain(";/login;");
  });

  it("if no token exists on query param, does not call createSession and redirects to unauthenticated page", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(new NextRequest("https://simpler.grants.gov")),
    );
    expect(createSessionMock).toHaveBeenCalledTimes(0);
    expect(redirectError.digest).toContain(";/unauthenticated;");
  });
});
