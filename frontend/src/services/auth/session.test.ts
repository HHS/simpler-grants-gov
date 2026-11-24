import {
  createAndReturnSession,
  createSession,
  getSession,
  refreshSession,
  setApiSessionDuration,
} from "src/services/auth/session";

const getCookiesMock = jest.fn(() => ({
  value: "some cookie value",
}));
const setCookiesMock = jest.fn();
const deleteCookiesMock = jest.fn();

const encodeTextMock = jest.fn((arg: string): string => arg);
const createPublicKeyMock = jest.fn((arg: string): string => arg);

const decryptMock = jest.fn();
const encryptMock = jest.fn();

const mockPostTokenRefresh = jest.fn();
const mockPostTokenRefreshWithToken = jest.fn();
const newExpirationDateMock = jest.fn((_seconds?: number) => new Date(0));

const cookiesMock = () => {
  return {
    get: getCookiesMock,
    set: setCookiesMock,
    delete: deleteCookiesMock,
  };
};

jest.mock("src/services/auth/sessionUtils", () => ({
  decrypt: (...args: unknown[]) => decryptMock(args) as unknown,
  encrypt: (...args: unknown[]) => encryptMock(args) as unknown,
  CLIENT_JWT_ENCRYPTION_ALGORITHM: "algo one",
  API_JWT_ENCRYPTION_ALGORITHM: "algo two",
  newExpirationDate: (seconds?: number) => newExpirationDateMock(seconds),
}));

jest.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

jest.mock("src/constants/environments", () => ({
  environment: {
    SESSION_SECRET: "session secret",
    API_JWT_PUBLIC_KEY: "api secret",
    ENVIRONMENT: "staging",
  },
}));

jest.mock("src/utils/generalUtils", () => ({
  encodeText: (arg: string): string => encodeTextMock(arg),
}));

jest.mock("crypto", () => ({
  createPublicKey: (arg: string): string => createPublicKeyMock(arg),
}));

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  postTokenRefresh: (arg: unknown): unknown => mockPostTokenRefresh(arg),
  postTokenRefreshWithToken: (arg: unknown): unknown =>
    mockPostTokenRefreshWithToken(arg),
}));

describe("getSession", () => {
  afterEach(() => jest.clearAllMocks());
  it("initializes session secrets if necessary", async () => {
    await getSession();
    expect(encodeTextMock).toHaveBeenCalledWith("session secret");
    expect(createPublicKeyMock).toHaveBeenCalledWith("api secret");
  });
  it("calls decrypt with the correct arguments and returns successfully", async () => {
    decryptMock.mockReturnValueOnce({
      token: "some decrypted token",
      exp: 123,
    });
    decryptMock.mockReturnValueOnce({
      arbitrary: "stuff",
    });
    const session = await getSession();
    expect(decryptMock).toHaveBeenCalledTimes(2);
    expect(decryptMock).toHaveBeenCalledWith([
      "some cookie value",
      "session secret",
      "algo one",
    ]);
    expect(decryptMock).toHaveBeenCalledWith([
      "some decrypted token",
      "api secret",
      "algo two",
    ]);
    expect(session).toEqual({
      token: "some decrypted token",
      arbitrary: "stuff",
      expiresAt: 123000,
    });
  });
  it("returns a session duration override from the client token", async () => {
    decryptMock.mockReturnValueOnce({
      token: "some decrypted token",
      exp: 123,
      session_duration_seconds: 60,
    });
    decryptMock.mockReturnValueOnce({ arbitrary: "stuff" });
    const session = await getSession();
    expect(session?.sessionDurationSeconds).toEqual(60);
  });
  it("drops an out of range session duration override", async () => {
    decryptMock.mockReturnValueOnce({
      token: "some decrypted token",
      exp: 123,
      session_duration_seconds: 60 * 60,
    });
    decryptMock.mockReturnValueOnce({ arbitrary: "stuff" });
    const session = await getSession();
    expect(session?.sessionDurationSeconds).toBeUndefined();
  });
  it("returns null without decrypting if there is no session cookie", async () => {
    getCookiesMock.mockReturnValueOnce(
      undefined as unknown as { value: string },
    );
    const session = await getSession();
    expect(session).toEqual(null);
    expect(decryptMock).not.toHaveBeenCalled();
  });
  it("returns null if client token decrypt does not return a payload and token", async () => {
    decryptMock.mockReturnValue(null);
    const session = await getSession();
    expect(session).toEqual(null);
  });
  it("returns null if api token decrypt does not return a payload", async () => {
    decryptMock
      .mockReturnValueOnce({
        token: "some decrypted token",
        exp: 123,
      })
      .mockReturnValueOnce(null);
    const session = await getSession();
    expect(session).toEqual(null);
  });
});

describe("createSession", () => {
  afterEach(() => jest.clearAllMocks());
  // to get this to work we'd need to manage resetting all modules before the test, which is a bit of a pain
  it.skip("initializes session secrets if necessary", async () => {
    await createSession("nothingSpecial", new Date(1));
    expect(encodeTextMock).toHaveBeenCalledWith("session secret");
    expect(createPublicKeyMock).toHaveBeenCalledWith("api secret");
  });
  it("calls cookie.set with expected values", async () => {
    encryptMock.mockReturnValue("encrypted session");
    await createSession("nothingSpecial", new Date(1));
    expect(encryptMock).toHaveBeenCalledWith([
      "nothingSpecial",
      new Date(1),
      "session secret",
      undefined,
    ]);
    expect(setCookiesMock).toHaveBeenCalledTimes(1);
    expect(setCookiesMock).toHaveBeenCalledWith(
      "session",
      "encrypted session",
      {
        httpOnly: true,
        secure: false, // true only in prod for now
        expires: new Date(1),
        sameSite: "lax",
        path: "/",
      },
    );
  });
});

describe("createAndReturnSession", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls cookie.set with expected values", async () => {
    encryptMock.mockReturnValue("encrypted session");
    await createAndReturnSession("nothingSpecial", new Date(1));
    expect(encryptMock).toHaveBeenCalledWith([
      "nothingSpecial",
      new Date(1),
      "session secret",
      undefined,
    ]);
    expect(setCookiesMock).toHaveBeenCalledTimes(1);
    expect(setCookiesMock).toHaveBeenCalledWith(
      "session",
      "encrypted session",
      {
        httpOnly: true,
        secure: false, // true only in prod for now
        expires: new Date(1),
        sameSite: "lax",
        path: "/",
      },
    );
  });

  it("calls decrypt with the correct arguments and returns successfully", async () => {
    decryptMock.mockReturnValueOnce({
      arbitrary: "stuff",
    });
    const session = await createAndReturnSession("nothingSpecial", new Date(1));
    expect(decryptMock).toHaveBeenCalledTimes(1);
    expect(decryptMock).toHaveBeenCalledWith([
      "nothingSpecial",
      "api secret",
      "algo two",
    ]);
    expect(session).toEqual({
      token: "nothingSpecial",
      arbitrary: "stuff",
      expiresAt: new Date(1).getTime(),
    });
  });
});

describe("refreshSession", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls refresh fetch function correctly", async () => {
    await refreshSession("a token");
    expect(mockPostTokenRefresh).toHaveBeenCalledTimes(1);
    expect(mockPostTokenRefresh).toHaveBeenCalledWith(undefined);
  });
  it("calls cookie.set with expected values", async () => {
    encryptMock.mockReturnValue("encrypted session");
    await createAndReturnSession("nothingSpecial", new Date(1));
    expect(encryptMock).toHaveBeenCalledWith([
      "nothingSpecial",
      new Date(1),
      "session secret",
      undefined,
    ]);
    expect(setCookiesMock).toHaveBeenCalledTimes(1);
    expect(setCookiesMock).toHaveBeenCalledWith(
      "session",
      "encrypted session",
      {
        httpOnly: true,
        secure: false, // true only in prod for now
        expires: new Date(1),
        sameSite: "lax",
        path: "/",
      },
    );
  });

  it("calls decrypt with the correct arguments and returns successfully", async () => {
    decryptMock.mockReturnValueOnce({
      arbitrary: "stuff",
    });
    const session = await createAndReturnSession("nothingSpecial", new Date(1));
    expect(decryptMock).toHaveBeenCalledTimes(1);
    expect(decryptMock).toHaveBeenCalledWith([
      "nothingSpecial",
      "api secret",
      "algo two",
    ]);
    expect(session).toEqual({
      token: "nothingSpecial",
      arbitrary: "stuff",
      expiresAt: new Date(1).getTime(),
    });
  });
  it("keeps the session duration override when refreshing", async () => {
    encryptMock.mockReturnValue("encrypted session");
    newExpirationDateMock.mockReturnValue(new Date(60000));
    decryptMock.mockReturnValueOnce({ arbitrary: "stuff" });

    const session = await refreshSession("a token", 60);

    expect(mockPostTokenRefresh).toHaveBeenCalledWith({
      body: { session_duration_seconds: 60 },
    });
    expect(newExpirationDateMock).toHaveBeenCalledWith(60);
    expect(encryptMock).toHaveBeenCalledWith([
      "a token",
      new Date(60000),
      "session secret",
      60,
    ]);
    expect(session).toEqual({
      token: "a token",
      arbitrary: "stuff",
      expiresAt: 60000,
      sessionDurationSeconds: 60,
    });
  });
});

describe("setApiSessionDuration", () => {
  it("refreshes the API session with the given token and duration", async () => {
    await setApiSessionDuration("a token", 60);
    expect(mockPostTokenRefreshWithToken).toHaveBeenCalledWith({
      body: { session_duration_seconds: 60 },
      additionalHeaders: { "X-SGG-Token": "a token" },
    });
  });
});
