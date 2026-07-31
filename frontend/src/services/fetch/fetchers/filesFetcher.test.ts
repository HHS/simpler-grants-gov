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
const mockAxiosPost = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchFileUploadWithMethod: (arg: unknown) =>
    mockFetchFileUploadWithMethod(arg) as unknown,
}));

jest.mock("axios", () => ({
  post: (...args: unknown[]) => mockAxiosPost(...args) as unknown,
  isAxiosError: (error: unknown): boolean =>
    !!(error as { isAxiosError?: boolean } | null)?.isAxiosError,
}));

// the shape of an AxiosError as far as uploadFileToS3 is concerned. `response`
// is absent when the request never got one
const axiosError = (response?: { status: number }) => ({
  isAxiosError: true,
  response,
});

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
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy.mockRestore();
  });

  const postedFormDataEntries = () => {
    const [, formData] = mockAxiosPost.mock.calls[0] as [string, FormData];
    return Array.from(formData.entries()).map(([key, value]) => [
      key,
      value instanceof File ? value.name : value,
    ]);
  };

  it("calls axios.post with the expected arguments", async () => {
    mockAxiosPost.mockResolvedValue({ status: 204 });
    const fakeFile = new File(["hi"], "hi.txt");
    const jsonBody = { something: "else" };

    const response = await uploadFileToS3("some url", jsonBody, fakeFile);

    expect(mockAxiosPost).toHaveBeenCalledWith(
      "some url",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect(postedFormDataEntries()).toEqual([
      ["something", "else"],
      ["file", "hi.txt"],
    ]);
    expect(response).toEqual(true);
  });
  it("skips empty body values and does not let a body `file` key clobber the upload", async () => {
    mockAxiosPost.mockResolvedValue({ status: 204 });
    const fakeFile = new File(["hi"], "hi.txt");

    await uploadFileToS3(
      "some url",
      { something: "else", empty: "", file: "not-the-real-file" },
      fakeFile,
    );

    expect(postedFormDataEntries()).toEqual([
      ["something", "else"],
      ["file", "hi.txt"],
    ]);
  });
  it("throws on failed request", async () => {
    // axios rejects on a non-2xx status rather than resolving
    mockAxiosPost.mockRejectedValue(axiosError({ status: 403 }));
    const fakeFile = new File(["hi"], "hi.txt");
    const jsonBody = { something: "else" };
    const err = await wrapForExpectedError(async () => {
      return await uploadFileToS3("some url", jsonBody, fakeFile);
    });
    expect(mockAxiosPost).toHaveBeenCalledWith(
      "some url",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect(postedFormDataEntries()).toEqual([
      ["something", "else"],
      ["file", "hi.txt"],
    ]);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error uploading file to S3 with status: 403",
    );
  });
  it("throws when the request fails without a response", async () => {
    mockAxiosPost.mockRejectedValue(axiosError());
    const fakeFile = new File(["hi"], "hi.txt");

    const err = await wrapForExpectedError(async () => {
      return await uploadFileToS3("some url", { something: "else" }, fakeFile);
    });

    expect(err).toBeInstanceOf(ApiRequestError);
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("with status"),
    );
  });
  it("throws when the failure is not an axios error", async () => {
    mockAxiosPost.mockRejectedValue(new Error("something else went wrong"));
    const fakeFile = new File(["hi"], "hi.txt");

    const err = await wrapForExpectedError(async () => {
      return await uploadFileToS3("some url", { something: "else" }, fakeFile);
    });

    expect(err).toBeInstanceOf(ApiRequestError);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error uploading file to S3");
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
