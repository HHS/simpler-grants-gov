/**
 * @jest-environment node
 */

import { GET } from "src/app/api/auth/logout-callback/route";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

const deleteSessionMock = jest.fn();
const clearCorrelationIdMock = jest.fn();

jest.mock("src/services/auth/sessionUtils", () => ({
  deleteSession: (): unknown => deleteSessionMock(),
}));

jest.mock("src/services/correlationId/correlationId", () => ({
  clearCorrelationId: (arg: string) => clearCorrelationIdMock(arg) as unknown,
}));

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("/api/auth/callback GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls deleteSession", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(),
    );

    expect(deleteSessionMock).toHaveBeenCalledTimes(1);
    expect(redirectError.digest).toContain(";/logout;");
  });

  it("clears correlation id", async () => {
    await wrapForExpectedError<{ digest: string }>(() => GET());
    expect(clearCorrelationIdMock).toHaveBeenCalledTimes(1);
    expect(clearCorrelationIdMock).toHaveBeenCalledWith(
      "Clearing correlation_id on logout",
    );
  });

  it("if no token exists on query param, does not call createSession and redirects to error page", async () => {
    deleteSessionMock.mockRejectedValue(new Error());
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(),
    );
    expect(clearCorrelationIdMock).toHaveBeenCalledTimes(0);
    expect(redirectError.digest).toContain(";/error;");
  });
});
