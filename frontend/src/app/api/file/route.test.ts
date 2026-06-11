/**
 * @jest-environment node
 */

import { ApiRequestError } from "src/errors";
import { FileUploadDetailsResponse } from "src/types/apiResponseTypes";
import {
  AdvanceTestStreamTrigger,
  createAdvanceStreamTrigger,
  makeAdvanceableTestStreamForTrigger,
} from "src/utils/testing/streamTestUtils";

import { NextRequest, NextResponse } from "next/server";

import { handleFileUpload } from "./handler";

const mockFetchFileUploadDetails = jest.fn<
  Promise<FileUploadDetailsResponse>,
  [File]
>();
const mockFetchFileUploadStatus = jest.fn();
const mockStartFileUpload = jest.fn();

let trigger: AdvanceTestStreamTrigger;
const testResponseChunks = ["step 1", "step 2", "step 3"];

// normally wouldn't bother typing these, but it makes asserting arguments easier in this case
jest.mock("src/services/fetch/fetchers/filesFetcher", () => ({
  fetchFileUploadDetails: (file: File) =>
    mockFetchFileUploadDetails(file) as unknown,
  fetchFileUploadStatus: (id: string) =>
    mockFetchFileUploadStatus(id) as unknown,
  startFileUpload: (url: string, body: unknown[]) =>
    mockStartFileUpload(url, body) as unknown,
}));

describe("POST request handler /api/file (handleFileUpload)", () => {
  beforeEach(() => {
    trigger = createAdvanceStreamTrigger();
    mockFetchFileUploadStatus.mockResolvedValue(
      makeAdvanceableTestStreamForTrigger(testResponseChunks, trigger),
    );
    mockFetchFileUploadDetails.mockResolvedValue({
      url: "any url",
      pending_file_id: "fake id",
      body: "some sort of body to send in the next request",
    });
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls fetchFileUploadDetails with uploaded file", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );
    // can't simply assert that this was called with the file from the request since
    // form data API seems to recreate / duplicate the file, meaning the mock file created is not
    // exactly the same as the mock file extracted from the form data
    expect(mockFetchFileUploadDetails).toHaveBeenCalledTimes(1);
    const fileArg: File = mockFetchFileUploadDetails.mock.calls[0][0];
    expect(fileArg).toBeInstanceOf(File);
    expect(fileArg.name).toEqual(testFile.name);
  });
  it("calls startFileUpload with returned data from fetchFileUploadDetails", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );

    expect(mockStartFileUpload).toHaveBeenCalledTimes(1);
    expect(mockStartFileUpload).toHaveBeenCalledWith(
      "any url",
      "some sort of body to send in the next request",
    );
  });
  it("calls fetchFileUploadStatus with pending_file_id from fetchFileUploadDetails", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );

    expect(mockFetchFileUploadStatus).toHaveBeenCalledWith("fake id");
  });
  it("returns a streamable response that contains data streamed from response from fetchFileUploadStatus", async () => {
    const testFile = new File(["file contents"], "file.txt");
    const testFormData = new FormData();
    testFormData.append("file", testFile);
    const response = await handleFileUpload(
      new NextRequest("http://arbitrary", {
        method: "POST",
        body: testFormData,
      }),
    );

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toEqual(200);
    expect(response.body).toBeInstanceOf(ReadableStream);

    const reader = response.body?.getReader();

    trigger.advance();
    const firstChunk = await reader?.read();
    expect(firstChunk?.value).toEqual("step 1");

    trigger.advance();
    const secondChunk = await reader?.read();
    expect(secondChunk?.value).toEqual("step 2");

    trigger.advance();
    const thirdChunk = await reader?.read();
    expect(thirdChunk?.value).toEqual("step 3");
  });
  it("returns an error response if fetchFileUploadDetails returns an error response", async () => {
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
    expect(response.status).toEqual(400);
    const responsePayload = (await response.json()) as { message: string };
    expect(responsePayload.message).toEqual(
      "Error attempting to upload file: api error",
    );
  });

  it("returns an error response if fetchFileUploadStatus returns an error response", async () => {
    mockFetchFileUploadStatus.mockRejectedValue(
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
    expect(response.status).toEqual(400);
    const responsePayload = (await response.json()) as { message: string };
    expect(responsePayload.message).toEqual(
      "Error attempting to upload file: api error",
    );
  });
});
