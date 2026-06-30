/**
 * @jest-environment node
 */

// have to run this in a node env in order to get the proper implementation of File
import { ApiRequestError } from "src/errors";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import {
  fetchFileScanStatus,
  fetchFileUploadDetails,
  uploadFileToS3,
} from "./filesFetcher";

const mockFetchFileUpload = jest.fn();
const mockFetchFileUploadWithMethod = jest.fn();
// slightly simplifies things by just asserting against the file name rather than the full file...
const mockCreateFormData = jest.fn();
const mockFetch = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchFileUploadWithMethod: (arg: unknown) =>
    mockFetchFileUploadWithMethod(arg) as unknown,
}));

jest.mock("src/utils/fileUtils/createFormData", () => ({
  createFormData: (fileName: string) => mockCreateFormData(fileName) as unknown,
}));

describe("fetchFileUploadDetails", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls fetchFileUploadWithMethod with expected arguments including form data output from createFormData", async () => {
    mockFetchFileUpload.mockResolvedValue({
      json: () => Promise.resolve({ data: "good return value" }),
    });
    mockFetchFileUploadWithMethod.mockImplementation(
      (_arg) => mockFetchFileUpload,
    );
    const response = await fetchFileUploadDetails("fileName", "mimeType");
    expect(mockFetchFileUploadWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetchFileUpload).toHaveBeenCalledWith({
      body: {
        file_name: "fileName",
        mime_type: "mimeType",
      },
    });
    expect(response).toEqual("good return value");
  });
});

describe("uploadFileToS3", () => {
  let originalFetch: typeof global.fetch;
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = mockFetch;
    // mocking this because in the jest env File objects don't have an array buffer
    mockCreateFormData.mockImplementation((fileName: string) => {
      const testFormData = new FormData();
      testFormData.append("file", fileName);
      return testFormData;
    });
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });
  it("calls fetch with the expected arguments", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const expectedFormData = new FormData();
    const fakeFile = new File(["hi"], "hi.txt");
    const jsonBody = { something: "else" };
    expectedFormData.append("file", "hi.txt");
    expectedFormData.append("something", "else");

    const response = await uploadFileToS3("some url", jsonBody, fakeFile);
    expect(mockFetch).toHaveBeenCalledWith("some url", {
      method: "POST",
      body: expectedFormData,
    });
    expect(response).toEqual(true);
  });
  it("throws on failed request", async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const expectedFormData = new FormData();
    const fakeFile = new File(["hi"], "hi.txt");
    const jsonBody = { something: "else" };
    expectedFormData.append("file", "hi.txt");
    expectedFormData.append("something", "else");
    const err = await wrapForExpectedError(async () => {
      return await uploadFileToS3("some url", jsonBody, fakeFile);
    });
    expect(mockFetch).toHaveBeenCalledWith("some url", {
      method: "POST",
      body: expectedFormData,
    });
    expect(err).toBeInstanceOf(ApiRequestError);
  });
});

describe("fetchFileScanStatus", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls fetchFileUploadWithMethod with expected arguments and returns resopnse body", async () => {
    mockFetchFileUpload.mockResolvedValue({
      body: "some sort of body that would actually be a stream",
    });
    mockFetchFileUploadWithMethod.mockImplementation(
      (_arg) => mockFetchFileUpload,
    );
    const response = await fetchFileScanStatus("pending file id");
    expect(mockFetchFileUploadWithMethod).toHaveBeenCalledWith("GET");
    expect(mockFetchFileUpload).toHaveBeenCalledWith({
      subPath: "/pending file id/results",
    });
    expect(response).toEqual(
      "some sort of body that would actually be a stream",
    );
  });
});
