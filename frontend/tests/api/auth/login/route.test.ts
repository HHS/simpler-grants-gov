/**
 * @jest-environment node
 */
import { GET } from "src/app/api/auth/login/route";
import { environment } from "src/constants/environments";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

jest.mock("src/constants/environments", () => ({
  environment: { AUTH_LOGIN_URL: "http://simpler.grants.gov/login" },
}));

describe("/api/auth/login GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("redirects correctly", async () => {
    // next redirects result in an error
    const error = await wrapForExpectedError<{
      digest: string;
      message: string;
    }>(() => GET());

    expect(error.message).toEqual("NEXT_REDIRECT");
    expect(error.digest).toContain(";http://simpler.grants.gov/login;");
    expect(error.digest).toContain(";307;");
  });
  it("errors correctly", () => {
    jest.replaceProperty(environment, "AUTH_LOGIN_URL", "");

    const response = GET();

    expect(response.headers.get("location")).toBe(null);
    expect(response.status).toBe(500);
  });
});
