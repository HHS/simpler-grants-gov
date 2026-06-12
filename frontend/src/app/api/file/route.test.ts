/**
 * @jest-environment node
 */

import { ApiRequestError } from "src/errors";
import { FileUploadDetailsResponse } from "src/types/apiResponseTypes";
import { FileUploadStatusUpdate } from "src/types/fileUploadTypes";
import {
  AdvanceTestStreamTrigger,
  createAdvanceStreamTrigger,
  makeAdvanceableTestStreamForTrigger,
} from "src/utils/testing/streamTestUtils";

import { NextRequest } from "next/server";

import { handleFileUpload } from "./handler";

const mockFetchFileUploadDetails = jest.fn<
  Promise<FileUploadDetailsResponse>,
  [File]
>();
const mockFetchFileScanStatus = jest.fn();
const mockUploadFileToS3 = jest.fn();

let trigger: AdvanceTestStreamTrigger;
let testStream: ReadableStream;
let testResponseChunks = [
  JSON.stringify({ status: "step 1" }),
  JSON.stringify({ status: "step 2" }),
  JSON.stringify({ status: "step 3" }),
];

// normally wouldn't bother typing these, but it makes asserting arguments easier in this case
jest.mock("src/services/fetch/fetchers/filesFetcher", () => ({
  fetchFileUploadDetails: (file: File) =>
    mockFetchFileUploadDetails(file) as unknown,
  fetchFileScanStatus: (id: string) => mockFetchFileScanStatus(id) as unknown,
  uploadFileToS3: (url: string, body: unknown[]) =>
    mockUploadFileToS3(url, body) as unknown,
}));

describe("POST request handler /api/file (handleFileUpload)", () => {
  beforeEach(() => {
    trigger = createAdvanceStreamTrigger();
    testStream = makeAdvanceableTestStreamForTrigger(
      testResponseChunks,
      trigger,
    );
    mockFetchFileScanStatus.mockResolvedValue(testStream);
    mockFetchFileUploadDetails.mockResolvedValue({
      url: "any url",
      pending_file_id: "fake id",
      body: "some sort of body to send in the next request",
    });
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("returns an error if no file is sent", async () => {
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: new FormData(),
      }),
    );
    expect(response.status).toEqual(400);
  });
  it("calls fetchFileUploadDetails with uploaded file, and streams 'queued' status", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;

    const firstChunk = await reader?.read();
    expect(firstChunk?.value?.status).toEqual("queued");

    // can't simply assert that this was called with the file from the request since
    // form data API seems to recreate / duplicate the file, meaning the mock file created is not
    // exactly the same as the mock file extracted from the form data
    expect(mockFetchFileUploadDetails).toHaveBeenCalledTimes(1);
    const fileArg: File = mockFetchFileUploadDetails.mock.calls[0][0];
    expect(fileArg).toBeInstanceOf(File);
    expect(fileArg.name).toEqual(testFile.name);
  });
  it("sets queued status while fetching s3 details", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;

    const firstChunk = await reader?.read();
    expect(firstChunk?.value?.status).toEqual("queued");
  });
  it("calls uploadFileToS3 with returned data from fetchFileUploadDetails, and streams 'uploading' status", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;

    await reader?.read();
    const secondChunk = await reader?.read();
    expect(secondChunk?.value?.status).toEqual("uploading");

    expect(mockUploadFileToS3).toHaveBeenCalledTimes(1);
    expect(mockUploadFileToS3).toHaveBeenCalledWith(
      "any url",
      "some sort of body to send in the next request",
    );
  });
  it("calls fetchFileScanStatus with pending_file_id from fetchFileUploadDetails, and streams 'starting-scan' status", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;

    await reader?.read();
    await reader?.read();
    const thirdChunk = await reader?.read();
    expect(thirdChunk?.value?.status).toEqual("starting-scan");

    expect(mockFetchFileScanStatus).toHaveBeenCalledWith("fake id");
  });
  it("streams data from fetchFileScanStatus into response stream", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;

    // advance through queued, uploading, and starting-scan states
    await reader?.read();
    await reader?.read();
    await reader?.read();

    trigger.advance();
    const firstChunk = await reader?.read();
    expect(firstChunk?.value?.status).toEqual("step 1");

    trigger.advance();
    const secondChunk = await reader?.read();
    expect(secondChunk?.value?.status).toEqual("step 2");

    trigger.advance();
    const thirdChunk = await reader?.read();
    expect(thirdChunk?.value?.status).toEqual("step 3");
  });
  it("streams error data if fetchFileUploadDetails returns an error response", async () => {
    mockFetchFileUploadDetails.mockRejectedValue(
      new ApiRequestError("api error"),
    );
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    // note that we'll still get a 200 response, even in an error case
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;
    await reader?.read();
    const errorChunk = await reader?.read();
    expect(errorChunk?.value?.status).toEqual("error");
    expect(errorChunk?.value?.error).toEqual("api error");
  });

  it("streams error data if uploadFileToS3 returns an error response", async () => {
    mockUploadFileToS3.mockRejectedValue(new ApiRequestError("api error"));
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    // note that we'll still get a 200 response, even in an error case
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;
    await reader?.read();
    await reader?.read();
    const errorChunk = await reader?.read();
    expect(errorChunk?.value?.status).toEqual("error");
    expect(errorChunk?.value?.error).toEqual("api error");
  });

  it("streams error data if fetchFileScanStatus returns an error response", async () => {
    mockFetchFileScanStatus.mockRejectedValue(new ApiRequestError("api error"));
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;

    await reader?.read();
    await reader?.read();
    await reader?.read();
    const errorChunk = await reader?.read();
    expect(errorChunk?.value?.status).toEqual("error");
    expect(errorChunk?.value?.error).toEqual("api error");
  });

  // waiting on implementing this since implementation depends on how the stream from /results will actually report errors
  it.skip("streams error data if fetchFileScanStatus encounters an error in the underlying response stream", async () => {
    testResponseChunks = [JSON.stringify({ status: "error" })];
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader =
      response.body?.getReader() as ReadableStreamDefaultReader<FileUploadStatusUpdate>;

    await reader?.read();
    await reader?.read();
    await reader?.read();
    await reader?.read();

    trigger.advance();
    const errorChunk = await reader?.read();
    expect(errorChunk?.value?.status).toEqual("error");
    expect(errorChunk?.value?.error).toEqual("api error");
  });

  // come back to this!
  it.skip("handles unexpected closing or erroring of the underlying response stream", async () => {
    /*
      to what degree can we manage this?

      - if the main response stream errors or closes unexpectedly, we won't be able to handle that within the endpoint
        - any errors there would need to be handled gracefully in the client
        - ex if we are expecting X number of status updates / changes and we only receive X-1 before the stream closes
          without warning that could be grounds for the client to throw a generic "upload failed, try again" type of error
      - if the /results stream errors or closes unexpectedly, we can handle that within here by sending a "scan failed"
        error to the client, which it can pick up and display as normal
          - we may also need to watch for the expected final state, and if that is not reached before the stream closes, throw
            an error, though we should maybe confirm that expectation
      - we may also want to watch for timeouts in both of these cases
    */
  });
});
