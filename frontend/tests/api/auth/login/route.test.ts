/**
 * @jest-environment node
 */
import { GET } from "src/app/api/auth/login/route";
import { environment } from "src/constants/environments";

jest.mock("src/constants/environments", () => ({
  environment: { AUTH_LOGIN_URL: "http://simpler.grants.gov/login" },
}));

describe("/api/auth/login GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("redirects correctly", () => {
    const response = GET();

    expect(response.headers.get("location")).toBe(
      "http://simpler.grants.gov/login",
    );
    expect(response.status).toBe(307);
  });
  it("errors correctly", () => {
    jest.replaceProperty(environment, "AUTH_LOGIN_URL", "");

    const response = GET();

    expect(response.headers.get("location")).toBe(null);
    expect(response.status).toBe(500);
  });
});
