/**
 * @jest-environment node
 */
import { GET } from "src/app/api/auth/logout/route";
import { environment } from "src/constants/environments";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

jest.mock("src/constants/environments", () => ({
  environment: { AUTH_LOGOUT_URL: "http://simpler.grants.gov/logout" },
}));

describe("/api/auth/logout GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("redirects correctly", async () => {
    // next redirects result in an error
    const error = await wrapForExpectedError<{
      digest: string;
      message: string;
    }>(() => GET(new NextRequest("https://simpler.grants.gov/")));

    expect(error.message).toEqual("NEXT_REDIRECT");
    expect(error.digest).toContain(";http://simpler.grants.gov/logout;");
    expect(error.digest).toContain(";307;");
  });
  it("errors correctly", () => {
    jest.replaceProperty(environment, "AUTH_LOGOUT_URL", "");

    const response = GET(new NextRequest("https://simpler.grants.gov/"));

    expect(response.headers.get("location")).toBe(null);
    expect(response.status).toBe(500);
  });
});
