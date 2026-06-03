import { getCorrelationId } from "src/services/correlationId/correlationId";
import { CORRELATION_ID_COOKIE } from "src/services/correlationId/correlationIdMiddleware";

const getCookieMock = jest.fn();

jest.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) => getCookieMock(name) as unknown,
    }),
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
