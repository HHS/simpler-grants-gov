import {
  createAndReturnSession,
  createSession,
  getSession,
  refreshSession,
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
  newExpirationDate: () => new Date(0),
}));

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

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  postTokenRefresh: (arg: unknown): unknown => mockPostTokenRefresh(arg),
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
  // eslint-disable-next-line jest/no-disabled-tests
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
    decryptMock.mockReturnValue({
      arbitrary: "stuff",
    });
    const session = await createAndReturnSession("nothingSpecial", new Date(1));
    expect(decryptMock).toHaveBeenCalledTimes(2);
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
    expect(mockPostTokenRefresh).toHaveBeenCalledWith({
      additionalHeaders: { "X-SGG-Token": "a token" },
    });
  });
  it("calls cookie.set with expected values", async () => {
    encryptMock.mockReturnValue("encrypted session");
    await createAndReturnSession("nothingSpecial", new Date(1));
    expect(encryptMock).toHaveBeenCalledWith([
      "nothingSpecial",
      new Date(1),
      "session secret",
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
    decryptMock.mockReturnValue({
      arbitrary: "stuff",
    });
    const session = await createAndReturnSession("nothingSpecial", new Date(1));
    expect(decryptMock).toHaveBeenCalledTimes(2);
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
