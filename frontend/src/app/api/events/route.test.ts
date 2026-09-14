/**
 * @jest-environment node
 */

import { POST } from "src/app/api/events/route";

const getCorrelationIdMock = jest.fn();
const loggerInfoMock = jest.fn();

jest.mock("src/services/correlationId/correlationId", () => ({
  getCorrelationId: () => getCorrelationIdMock() as unknown,
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    info: (arg: unknown) => loggerInfoMock(arg) as unknown,
  },
}));

const buildRequest = (body: unknown): Request =>
  new Request("http://fake-host.test/api/events", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/events", () => {
  afterEach(() => jest.resetAllMocks());

  it("produces exactly one log line carrying the correlation_id from the client POST", async () => {
    const correlationId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCorrelationIdMock.mockResolvedValueOnce(correlationId);

    const response = await POST(
      buildRequest({
        name: "click_legacy_opportunity_link",
        properties: { opportunityId: 123 },
      }),
    );

    expect(response.status).toBe(200);
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlationId,
      event: "click_legacy_opportunity_link",
      properties: { opportunityId: 123 },
    });
  });

  it("logs an undefined correlation_id when no cookie is present", async () => {
    getCorrelationIdMock.mockResolvedValueOnce(undefined);

    const response = await POST(buildRequest({ name: "opportunity_saved" }));

    expect(response.status).toBe(200);
    expect(loggerInfoMock).toHaveBeenCalledTimes(1);
    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlationId: undefined,
      event: "opportunity_saved",
      properties: undefined,
    });
  });

  it("returns 400 and does not log when the request body isn't valid JSON", async () => {
    const response = await POST(
      new Request("http://fake-host.test/api/events", {
        method: "POST",
        body: "not json",
      }),
    );

    expect(response.status).toBe(400);
    expect(loggerInfoMock).not.toHaveBeenCalled();
  });
});
