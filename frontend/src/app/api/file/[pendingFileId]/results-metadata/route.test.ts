/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { getFileResultsMetadata } from "./handler";

const mockFetchFileScanStatus = jest.fn();

jest.mock("src/services/fetch/fetchers/filesFetcher", () => ({
  fetchFileScanStatus: (id: string) => mockFetchFileScanStatus(id) as unknown,
}));

const fakeRequest = new NextRequest("http://arbitrary");

const buildParams = (pendingFileId: string) => ({
  params: Promise.resolve({ pendingFileId }),
});

const encode = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value));

describe("GET /api/file/:pendingFileId/results-metadata (getFileResultsMetadata)", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("returns file_metadata from the first chunk once scanning is complete", async () => {
    const fileMetadata = { file_name: "budget.pdf", file_size_bytes: 4096 };
    mockFetchFileScanStatus.mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encode({ data: { file_metadata: fileMetadata } }));
        },
      }),
    );

    const response = await getFileResultsMetadata(
      fakeRequest,
      buildParams("pending-1"),
    );

    expect(response.status).toEqual(200);
    expect((await response.json()) as unknown).toEqual({
      file_metadata: fileMetadata,
    });
    expect(mockFetchFileScanStatus).toHaveBeenCalledWith("pending-1");
  });

  it(
    "does not hang waiting for the reader to cancel, even when the underlying " +
      "stream's cancellation never resolves (regression: this stream is a long-poll " +
      "connection the backend can keep open, and canceling it can hang)",
    async () => {
      mockFetchFileScanStatus.mockResolvedValue(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encode({ data: { file_metadata: { file_name: "a.pdf" } } }),
            );
            // deliberately never closes - simulates a still-open long-poll connection
          },
          cancel() {
            // simulates a cancellation that never resolves
            return new Promise(() => {});
          },
        }),
      );

      const response = await getFileResultsMetadata(
        fakeRequest,
        buildParams("pending-1"),
      );

      expect(response.status).toEqual(200);
    },
  );

  it("returns 409 when the scan has not completed yet", async () => {
    mockFetchFileScanStatus.mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encode({ data: { file_metadata: null } }));
        },
      }),
    );

    const response = await getFileResultsMetadata(
      fakeRequest,
      buildParams("pending-1"),
    );

    expect(response.status).toEqual(409);
  });

  it("returns 404 when the stream produces no chunk at all", async () => {
    mockFetchFileScanStatus.mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
    );

    const response = await getFileResultsMetadata(
      fakeRequest,
      buildParams("pending-1"),
    );

    expect(response.status).toEqual(404);
  });

  it("returns 500 when fetchFileScanStatus throws", async () => {
    mockFetchFileScanStatus.mockRejectedValue(new Error("boom"));

    const response = await getFileResultsMetadata(
      fakeRequest,
      buildParams("pending-1"),
    );

    expect(response.status).toEqual(500);
  });
});
