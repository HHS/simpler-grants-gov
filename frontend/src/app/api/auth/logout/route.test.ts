/**
 * @jest-environment node
 */
import { GET } from "src/app/api/auth/logout/route";
import { environment } from "src/constants/environments";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const FAKE_LOGOUT_TOKEN = "fake-logout-token";
const mockSetLogoutTokenCookie = jest.fn();
const mockGetSession = jest.fn();

jest.mock("src/constants/environments", () => ({
  environment: { AUTH_LOGOUT_URL: "http://simpler.grants.gov/logout" },
}));

jest.mock("src/services/auth/sessionUtils", () => ({
  setLogoutTokenCookie: (token: string) =>
    mockSetLogoutTokenCookie(token) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession() as unknown,
}));

describe("/api/auth/logout GET handler", () => {
  beforeEach(() => {
    mockGetSession.mockReturnValue({ token: FAKE_LOGOUT_TOKEN });
    jest.replaceProperty(
      environment,
      "AUTH_LOGOUT_URL",
      "http://some-test-url",
    );
  });
  afterEach(() => jest.clearAllMocks());
  it("redirects correctly", async () => {
    // next redirects result in an error
    const error = await wrapForExpectedError<{
      digest: string;
      message: string;
    }>(() => GET(new NextRequest("https://simpler.grants.gov/")));

    expect(error.message).toEqual("NEXT_REDIRECT");
    expect(error.digest).toContain(";http://some-test-url;");
    expect(error.digest).toContain(";307;");
  });
  it("errors correctly if logout url is not set", async () => {
    jest.replaceProperty(environment, "AUTH_LOGOUT_URL", "");

    const response = await GET(new NextRequest("https://simpler.grants.gov/"));

    expect(response.headers.get("location")).toBe(null);
    expect(response.status).toBe(500);
  });
  it("sets token in logout cookie", async () => {
    await wrapForExpectedError<{
      digest: string;
      message: string;
    }>(() => GET(new NextRequest("https://simpler.grants.gov/")));
    expect(mockSetLogoutTokenCookie).toHaveBeenCalledWith(FAKE_LOGOUT_TOKEN);
  });
  it("errors correctly if user token is not present", async () => {
    mockGetSession.mockReturnValue({ token: "" });
    const response = await GET(new NextRequest("https://simpler.grants.gov/"));

    expect(response.headers.get("location")).toBe(null);
    expect(response.status).toBe(500);
  });
});
