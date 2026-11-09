import { logUserEvent } from "src/services/event/logUserEvent";

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

describe("logUserEvent", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("logs properties as top-level attributes with the event name and correlation id", async () => {
    const correlationId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCorrelationIdMock.mockResolvedValueOnce(correlationId);

    await logUserEvent({
      name: "click_start_application",
      properties: { competitionId: "abc", opportunityId: 123 },
    });

    expect(loggerInfoMock).toHaveBeenCalledWith({
      competitionId: "abc",
      correlation_id: correlationId,
      event: "click_start_application",
      opportunityId: 123,
    });
  });

  it("logs an event without properties", async () => {
    const correlationId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCorrelationIdMock.mockResolvedValueOnce(correlationId);

    await logUserEvent({ name: "session_expired" });

    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlation_id: correlationId,
      event: "session_expired",
    });
  });

  it("does not let properties override event or correlation_id", async () => {
    const correlationId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCorrelationIdMock.mockResolvedValueOnce(correlationId);

    await logUserEvent({
      name: "example",
      properties: {
        event: "fake",
        correlation_id: "fake-id",
        reason: "missing",
      },
    });

    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlation_id: correlationId,
      event: "example",
      reason: "missing",
    });
  });

  it("does not let properties supply a correlation_id when none is available", async () => {
    getCorrelationIdMock.mockResolvedValueOnce(undefined);

    await logUserEvent({
      name: "destination_rejected",
      properties: { correlation_id: "fake-id", reason: "invalid" },
    });

    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlation_id: undefined,
      event: "destination_rejected",
      reason: "invalid",
    });
  });
});
