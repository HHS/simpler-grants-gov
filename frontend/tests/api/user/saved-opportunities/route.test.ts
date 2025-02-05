/**
 * @jest-environment node
 */

import { POST } from "src/app/api/user/saved-opportunities/route";

const fetchMock = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({ status_code: 200 }),
  ok: true,
  status: 200,
});
const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/constants/environments", () => ({
  environment: {
    API_URL: "http://example.com",
  },
}));

describe("POST request", () => {
  let originalFetch: typeof global.fetch;
  beforeAll(() => {
    originalFetch = global.fetch;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });
  beforeEach(() => {
    global.fetch = fetchMock;
  });
  afterEach(() => jest.clearAllMocks());
  it("returns saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
      user_id: 1,
    }));
    const requestObj = {
      headers: { opportunity_id: 1 },
    } as any;
    const req = new Request("http://localhost:3000");
    req.headers.set("opportunity_id", "1");
    const response = await POST(req);
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.message).toBe("saved opportunity success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });
});
