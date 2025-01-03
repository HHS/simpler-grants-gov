import { SessionManager } from "src/services/auth/session";

const getCookiesMock = jest.fn();
const setCookiesMock = jest.fn();
const deleteCookiesMock = jest.fn();
const jwtVerifyMock = jest.fn();

const encodeTextMock = jest.fn((arg) => arg);
const createPublicKeyMock = jest.fn((arg) => arg);

const cookiesMock = () => {
  return {
    get: getCookiesMock,
    set: setCookiesMock,
    delete: deleteCookiesMock,
  };
};

jest.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

jest.mock("src/constants/environments", () => ({
  environment: {
    SESSION_SECRET: "session secret",
    API_JWT_PUBLIC_KEY: "api secret",
  },
}));

jest.mock("src/utils/generalUtils", () => ({
  encodeText: (arg: string): string => encodeTextMock(arg),
}));

jest.mock("crypto", () => ({
  createPublicKey: (arg: string): string => createPublicKeyMock(arg),
}));

describe("SessionManager", () => {
  let manager: SessionManager;
  beforeEach(() => {
    manager = new SessionManager();
  });
  afterEach(() => jest.clearAllMocks());
  it("constructs correctly with necessary key values", () => {
    expect(encodeTextMock).toHaveBeenCalledWith("session secret");
    expect(createPublicKeyMock).toHaveBeenCalledWith("api secret");
    expect(manager).toBeInstanceOf(SessionManager);
  });

  describe("getSession", () => {\
    it('calls decrypt with the correct arguments and returns successfully', () => {

    })
    it('returns null if client token decrypt does not return a payload and token', () => {})
    it('returns null if api token decrypt does not return a payload', () => {})
  });

  it("calls cookie.set with expected values", async () => {
    await createSession("nothingSpecial");
    expect(setCookiesMock).toHaveBeenCalledTimes(1);
    expect(setCookiesMock).toHaveBeenCalledWith("session", "nothingSpecial", {
      httpOnly: true,
      secure: true,
      expires: expect.any(Date) as Date,
      sameSite: "lax",
      path: "/",
    });
  });
});

describe("getTokenFromCookie", () => {
  afterEach(() => jest.clearAllMocks());
  it("returns null if decrypt returns no session", async () => {
    jwtVerifyMock.mockImplementation(() => null);
    const result = await getTokenFromCookie("invalidEncryptedCookie");
    expect(result).toEqual(null);
  });

  it("returns null if decrypt returns session with no token", async () => {
    jwtVerifyMock.mockImplementation(() => ({}));
    const result = await getTokenFromCookie("invalidEncryptedCookie");
    expect(result).toEqual(null);
  });

  it("returns token returned from decryp", async () => {
    jwtVerifyMock.mockImplementation((token: string) => ({
      payload: { token },
    }));
    const result = await getTokenFromCookie("invalidEncryptedCookie");
    expect(result).toEqual({ token: "invalidEncryptedCookie" });
  });
});

describe("getSession", () => {
  afterEach(() => jest.clearAllMocks());
  it("returns null if there is no session cookie", async () => {
    const result = await getSession();
    expect(result).toEqual(null);
  });
});
