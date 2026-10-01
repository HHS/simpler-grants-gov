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

  it("logs the event name and properties with the correlation id", async () => {
    const correlationId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    getCorrelationIdMock.mockResolvedValueOnce(correlationId);

    await logUserEvent({
      name: "opportunity_saved",
      properties: { opportunityId: 123 },
    });

    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlationId,
      event: "opportunity_saved",
      properties: { opportunityId: 123 },
    });
  });

  it("logs with an undefined correlation id when none is available", async () => {
    getCorrelationIdMock.mockResolvedValueOnce(undefined);

    await logUserEvent({ name: "opportunity_saved" });

    expect(loggerInfoMock).toHaveBeenCalledWith({
      correlationId: undefined,
      event: "opportunity_saved",
      properties: undefined,
    });
  });
});
