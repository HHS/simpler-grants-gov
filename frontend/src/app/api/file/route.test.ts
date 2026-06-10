/**
 * @jest-environment node
 */

import { FileUploadDetailsResponse } from "src/types/apiResponseTypes";
import {
  createAdvanceStreamTrigger,
  makeAdvanceableTestStreamForTrigger,
} from "src/utils/testing/streamTestUtils";

import { NextRequest } from "next/server";

import { handleFileUpload } from "./handler";

const mockFetchFileUploadDetails = jest
  .fn<Promise<FileUploadDetailsResponse>, [File]>()
  .mockResolvedValue({
    url: "any url",
    pending_file_id: "fake id",
    body: "some sort of body to send in the next request",
  });
const mockFetchFileUploadStatus = jest.fn();
const mockStartFileUpload = jest.fn();

let trigger;
const testResponseChunks = ["step 1", "step 2", "step 3"];

// normally wouldn't bother typing these, but it makes asserting arguments easier in this case
jest.mock("src/services/fetch/fetchers/filesFetcher", () => ({
  fetchFileUploadDetails: (file: File) =>
    mockFetchFileUploadDetails(file) as unknown,
  fetchFileUploadStatus: () => mockFetchFileUploadStatus() as unknown,
  startFileUpload: (url: string, body: unknown[]) =>
    mockStartFileUpload(url, body) as unknown,
}));

describe("POST request handler /api/file (handleFileUpload)", () => {
  beforeEach(() => {
    trigger = createAdvanceStreamTrigger();
    mockFetchFileUploadStatus.mockResolvedValue(
      makeAdvanceableTestStreamForTrigger(testResponseChunks, trigger),
    );
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it.only("calls fetchFileUploadDetails with uploaded file", async () => {
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
    // form data API seems to recreate / duplicate the file, meaning the file is not
    // exactly the same
    expect(mockFetchFileUploadDetails).toHaveBeenCalledTimes(1);
    const fileArg: File = mockFetchFileUploadDetails.mock.calls[0][0];
    expect(fileArg).toBeInstanceOf(File);
    expect(fileArg.name).toEqual(testFile.name);
  });
  it("calls startFileUpload with returned data from fetchFileUploadDetails", async () => {});
  it("calls fetchFileUploadStatus with pending_file_id from fetchFileUploadDetails", async () => {});
  it("returns a streamable response that contains data streamed from response from fetchFileUploadStatus", async () => {});
});
