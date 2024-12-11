import { identity } from "lodash";
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

// close over the token.
const setJWTMocksWithToken = (token: string) => {
  signMock.mockImplementation(() => token);
};

const fakeJWTInstance = (): RecursiveObject => ({
  setProtectedHeader: setProtectedHeaderMock,
  setIssuedAt: setIssuedAtMock,
  setExpirationTime: setExpirationTimeMock,
  sign: signMock,
});

const cookiesMock = jest.fn(() => ({
  get: getCookiesMock,
  set: setCookiesMock,
  delete: deleteCookiesMock,
}));

jest.mock("src/services/auth/session", () => ({
  ...jest.requireActual<typeof import("src/services/auth/session")>(
    "src/services/auth/session",
  ),
  newExpirationDate: () => new Date(0),
}));

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
  afterEach(() => {
    jest.resetAllMocks();
  });
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
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls JWT verification with expected values and returns payload", async () => {
    jwtVerifyMock.mockImplementation((...args) => ({ payload: args }));
    const cookie = "fakeCookie";
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
    const cookie = "fakeCookie";
    const decrypted = await decrypt(cookie);
    expect(decrypted).toEqual(null);
  });
});

describe("getTokenFromCookie", () => {
  it();
});
