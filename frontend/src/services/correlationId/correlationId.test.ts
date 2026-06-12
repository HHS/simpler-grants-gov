import {
  clearCorrelationId,
  getCorrelationId,
} from "src/services/correlationId/correlationId";
import { CORRELATION_ID_COOKIE } from "src/services/correlationId/correlationIdMiddleware";

const getCookieMock = jest.fn();
const deleteCookieMock = jest.fn();
const loggerInfoMock = jest.fn();

jest.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => getCookieMock(name) as unknown,
      delete: (name: string) => deleteCookieMock(name) as unknown,
    }),
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    info: (arg: unknown) => loggerInfoMock(arg) as unknown,
  },
}));

describe("getCorrelationId", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns the cookie value when the correlation_id cookie is set", async () => {
    const value = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCookieMock.mockReturnValueOnce({ value });

    await expect(getCorrelationId()).resolves.toBe(value);
    expect(getCookieMock).toHaveBeenCalledWith(CORRELATION_ID_COOKIE);
  });

  it("returns undefined when the cookie is not set", async () => {
    getCookieMock.mockReturnValueOnce(undefined);

    await expect(getCorrelationId()).resolves.toBeUndefined();
    expect(getCookieMock).toHaveBeenCalledWith(CORRELATION_ID_COOKIE);
  });
});

describe("clearCorrelationId", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("deletes the cookie and logs when the correlation_id cookie is set", async () => {
    const correlation_id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCookieMock.mockReturnValueOnce({ value: correlation_id });

    await clearCorrelationId();

    expect(getCookieMock).toHaveBeenCalledWith(CORRELATION_ID_COOKIE);
    expect(deleteCookieMock).toHaveBeenCalledWith(CORRELATION_ID_COOKIE);
    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlation_id,
      message: "Clearing correlation id",
      event: "correlation_id_cleared",
    });
  });

  it("uses the provided message when logging", async () => {
    const correlation_id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCookieMock.mockReturnValueOnce({ value: correlation_id });

    await clearCorrelationId("Logging out");

    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlation_id,
      message: "Logging out",
      event: "correlation_id_cleared",
    });
  });

  it("does nothing when the cookie is not set", async () => {
    getCookieMock.mockReturnValueOnce(undefined);

    await clearCorrelationId();

    expect(getCookieMock).toHaveBeenCalledWith(CORRELATION_ID_COOKIE);
    expect(deleteCookieMock).not.toHaveBeenCalled();
    expect(loggerInfoMock).not.toHaveBeenCalled();
  });
});
