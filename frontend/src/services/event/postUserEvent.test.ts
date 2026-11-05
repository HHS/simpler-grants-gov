import { postUserEvent } from "src/services/event/postUserEvent";

const readBlobAsText = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("failed to read blob"));
    reader.readAsText(blob);
  });

describe("postUserEvent", () => {
  afterEach(() => jest.restoreAllMocks());

  it("sends the event to /api/events via sendBeacon", async () => {
    const sendBeaconMock = jest.fn();
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeaconMock,
      writable: true,
    });

    postUserEvent({
      name: "opportunity_saved",
      properties: { opportunityId: 123 },
    });

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const [url, blob] = sendBeaconMock.mock.calls[0] as [string, Blob];
    expect(url).toBe("/api/events");
    expect(blob.type).toBe("application/json");
    expect(JSON.parse(await readBlobAsText(blob))).toEqual({
      name: "opportunity_saved",
      properties: { opportunityId: 123 },
    });
  });

  it("does nothing when sendBeacon is unavailable", () => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      writable: true,
    });

    expect(() => postUserEvent({ name: "opportunity_saved" })).not.toThrow();
  });
});
