import {
  createSession,
  decrypt,
  deleteSession,
  encrypt,
  getSession,
  getTokenFromCookie,
} from "src/services/auth/session";

type RecursiveObject = {
  [key: string]: () => RecursiveObject | string;
};

const getCookiesMock = jest.fn();
const setCookiesMock = jest.fn();
const deleteCookiesMock = jest.fn();
const reallyFakeMockJWTConstructor = jest.fn();
const setProtectedHeaderMock = jest.fn(() => fakeJWTInstance());
const setIssuedAtMock = jest.fn(() => fakeJWTInstance());
const setExpirationTimeMock = jest.fn(() => fakeJWTInstance());
const signMock = jest.fn();
const jwtVerifyMock = jest.fn();

// close over the token
// all of this rigmarole means that the mocked signing functionality will output the token passed into it
const setJWTMocksWithToken = (token: string) => {
  signMock.mockImplementation(() => token);
};

const fakeJWTInstance = (): RecursiveObject => ({
  setProtectedHeader: setProtectedHeaderMock,
  setIssuedAt: setIssuedAtMock,
  setExpirationTime: setExpirationTimeMock,
  sign: signMock,
});

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

jest.mock("jose", () => ({
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
  SignJWT: function SignJWTMock(
    this: {
      setProtectedHeader: typeof jest.fn;
      setIssuedAt: typeof jest.fn;
      setExpirationTime: typeof jest.fn;
      sign: typeof jest.fn;
      token: string;
    },
    { token = "" } = {},
  ) {
    reallyFakeMockJWTConstructor();
    setJWTMocksWithToken(token);
    return {
      ...fakeJWTInstance(),
    };
  },
}));

jest.mock("src/constants/environments", () => ({
  environment: {
    SESSION_SECRET: "session secret",
  },
}));

jest.mock("src/utils/generalUtils", () => ({
  encodeText: (arg: string): string => arg,
}));

describe("encrypt", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls all the JWT functions with expected values and returns expected value", async () => {
    const token = "fakeToken";
    const expiresAt = new Date();
    const encrypted = await encrypt({ token, expiresAt });

    expect(reallyFakeMockJWTConstructor).toHaveBeenCalledTimes(1);

    expect(setProtectedHeaderMock).toHaveBeenCalledTimes(1);
    expect(setProtectedHeaderMock).toHaveBeenCalledWith({ alg: "HS256" });

    expect(setIssuedAtMock).toHaveBeenCalledTimes(1);

    expect(setExpirationTimeMock).toHaveBeenCalledTimes(1);
    expect(setExpirationTimeMock).toHaveBeenCalledWith(expiresAt);

    expect(signMock).toHaveBeenCalledTimes(1);
    expect(signMock).toHaveBeenCalledWith("session secret");

    // this is synthetic but generally proves things are working
    expect(encrypted).toEqual(token);
  });
});

describe("decrypt", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls JWT verification with expected values and returns payload", async () => {
    const cookie = "fakeCookie";
    jwtVerifyMock.mockImplementation((...args) => ({ payload: args }));
    const decrypted = await decrypt(cookie);

    expect(jwtVerifyMock).toHaveBeenCalledTimes(1);
    expect(jwtVerifyMock).toHaveBeenCalledWith(cookie, "session secret", {
      algorithms: ["HS256"],
    });

    expect(decrypted).toEqual([
      cookie,
      "session secret",
      { algorithms: ["HS256"] },
    ]);
  });

  it("returns null on error", async () => {
    jwtVerifyMock.mockImplementation(() => {
      throw new Error();
    });
    const cookie = "fakeCookie";
    const decrypted = await decrypt(cookie);
    expect(decrypted).toEqual(null);
  });
});

describe("createSession", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls cookie.set with expected values", async () => {
    await createSession("nothingSpecial");
    expect(setCookiesMock).toHaveBeenCalledTimes(1);
    expect(setCookiesMock).toHaveBeenCalledWith("session", "nothingSpecial", {
      httpOnly: true,
      secure: true,
      expires: expect.any(Date),
      sameSite: "lax",
      path: "/",
    });
  });
});

describe("deleteSession", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls cookie.delete with expected values", () => {
    deleteSession();
    expect(deleteCookiesMock).toHaveBeenCalledTimes(1);
    expect(deleteCookiesMock).toHaveBeenCalledWith("session");
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
    jwtVerifyMock.mockImplementation((arg) => ({ payload: { token: arg } }));
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
