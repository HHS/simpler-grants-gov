/**
 * @jest-environment node
 */

import { GET } from "src/app/api/env/route";

jest.mock("src/constants/environments", () => ({
  environment: {
    AUTH_LOGIN_URL: "testable",
  },
}));

describe("/api/env GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("gets correct envars", async () => {
    const resp = GET();
    const data = (await resp.json()) as { auth_login_url: string };
    expect(data.auth_login_url).toBe("testable");
  });
});
