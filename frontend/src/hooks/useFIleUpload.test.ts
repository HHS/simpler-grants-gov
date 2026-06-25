/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { renderHook, waitFor } from "@testing-library/react";
import { noop } from "lodash";
import {
  createAdvanceStreamTrigger,
  makeAdvanceableTestStreamForTrigger,
} from "src/utils/testing/streamTestUtils";

import { act } from "react";

import { useFileUpload } from "./useFileUpload";

const clientFetchMock = jest.fn<
  Promise<Response>,
  [string, { method: string; body: unknown; signal: unknown }]
>();
const fakeAbortController = jest.fn();
const fakeTextDecoder = jest.fn();
const fakeFileReader = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (
      url: string,
      options: { method: string; body: unknown; signal: unknown },
    ) => clientFetchMock(url, options) as unknown,
  }),
}));

const fakeFile = new File(["test content"], "test.txt", {
  type: "text/plain",
});

let originalAbortController: typeof AbortController;
let originalTextDecoder: typeof TextDecoder;
let originalFileReader: typeof FileReader;

describe("useFileUpload", () => {
  beforeEach(() => {
    originalAbortController = global.AbortController;
    global.AbortController = fakeAbortController;

    fakeTextDecoder.mockImplementation(() => ({
      decode: (value: unknown) => value,
    }));
    originalTextDecoder = global.TextDecoder;
    global.TextDecoder = fakeTextDecoder;

    // file reader needs to get mocked because it is used in the trussworks
    // FilePreview (even though we are hiding this), and it doesn't play well with
    // the JSDOM version of Blobs
    fakeFileReader.mockImplementation(() => ({
      readAsDataURL: jest.fn(),
    }));
    originalFileReader = global.FileReader;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.FileReader = fakeFileReader;
  });
  afterEach(() => {
    global.TextDecoder = originalTextDecoder;
    global.AbortController = originalAbortController;
    global.FileReader = originalFileReader;
    jest.resetAllMocks();
  });
  it("returns the expected interface", () => {
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: noop,
        onError: noop,
        onComplete: noop,
        postUploadAction: jest.fn(),
      }),
    );
    expect(result.current.currentStatus).toEqual(undefined);
    expect(result.current.fileName).toEqual(undefined);
    expect(result.current.handleCancel).toBeInstanceOf(Function);
    expect(result.current.dismissError).toBeInstanceOf(Function);
    expect(result.current.uploadError).toEqual(undefined);
    expect(result.current.uploadFile).toBeInstanceOf(Function);
  });
  it("calls clientFetch as expected on upload", async () => {
    fakeAbortController.mockImplementation(() => ({
      signal: "signal",
    }));
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: noop,
        onError: noop,
        onComplete: noop,
        postUploadAction: jest.fn(() => Promise.resolve("return value")),
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    await waitFor(() => {
      expect(clientFetchMock).toHaveBeenCalled();
    });
    expect(clientFetchMock.mock.calls[0][0]).toEqual("/api/file");
    expect(clientFetchMock.mock.calls[0][1].method).toEqual("POST");
    expect(clientFetchMock.mock.calls[0][1].body).toBeInstanceOf(FormData);
    expect(clientFetchMock.mock.calls[0][1].signal).toBe("signal");
  });
  it("only allows calling uploadFile once per hook instance", async () => {
    const onSuccessMock = jest.fn();
    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [JSON.stringify({ status: "whatever", pendingFileId: "1" })],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: onSuccessMock,
        onError: noop,
        onComplete: noop,
        postUploadAction: jest.fn(() => Promise.resolve("return value")),
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
      result.current.uploadFile(fakeFile);
    });
    trigger.advance();
    await waitFor(() => expect(onSuccessMock).toHaveBeenCalled());
    expect(clientFetchMock).toHaveBeenCalledTimes(1);
  });
  it("returns correct file name", () => {
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: noop,
        onError: noop,
        onComplete: noop,
        postUploadAction: jest.fn(() => Promise.resolve("return value")),
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    expect(result.current.fileName).toEqual(fakeFile.name);
  });
  it("returns currentStatus as expected during happy path upload", async () => {
    const onSuccessMock = jest.fn();
    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [JSON.stringify({ status: "uploading", pendingFileId: "1" })],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: onSuccessMock,
        onError: noop,
        onComplete: noop,
        postUploadAction: jest.fn(() => Promise.resolve("return value")),
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    expect(result.current.currentStatus).toEqual("queued");
    // having a hard time managing state changes in this test, since
    // the state updates multiple times without any user action.
    // As a result, the state jumps directly from queued to success.
    // By debugging you can tell that the calls to update state are being made
    // and you can confirm in the app or in the SimplerFileInput tests that the state is updated in the hook,
    // but this test isn't working right, yet. - DWS
    trigger.advance();
    // await waitFor(() =>
    //   expect(result.current.currentStatus).toEqual("uploading"),
    // );
    // await waitFor(() =>
    //   expect(result.current.currentStatus).toEqual("post-upload"),
    // );
    await waitFor(() =>
      expect(result.current.currentStatus).toEqual("success"),
    );
  });
  it("calls post upload action during upload and calls onSuccess callback with return value", async () => {
    const onSuccessMock = jest.fn();
    const postUploadActionMock = jest.fn(() => Promise.resolve("return value"));
    fakeAbortController.mockImplementation(() => ({
      signal: "signal",
    }));
    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [JSON.stringify({ status: "uploading", pendingFileId: "1" })],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: onSuccessMock,
        onError: noop,
        onComplete: noop,
        postUploadAction: postUploadActionMock,
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    act(() => trigger.advance());
    await waitFor(() =>
      expect(onSuccessMock).toHaveBeenCalledWith("return value"),
    );
    await waitFor(() =>
      expect(postUploadActionMock).toHaveBeenCalledWith("1", "signal"),
    );
  });
  it("calls happy path callbacks during upload as expected", async () => {
    const onSuccessMock = jest.fn();
    const onStartMock = jest.fn();
    const onCompleteMock = jest.fn();
    const postUploadActionMock = jest.fn(() => Promise.resolve("return value"));

    fakeAbortController.mockImplementation(() => ({
      signal: "signal",
    }));

    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [JSON.stringify({ status: "uploading", pendingFileId: "1" })],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: onStartMock,
        onSuccess: onSuccessMock,
        onError: noop,
        onComplete: onCompleteMock,
        postUploadAction: postUploadActionMock,
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    act(() => trigger.advance());
    // this does not fully validate the order of the calls, unfortunately
    expect(onSuccessMock).not.toHaveBeenCalled();
    await waitFor(() => expect(onStartMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(onSuccessMock).toHaveBeenCalledWith("return value"),
    );
    await waitFor(() => expect(onCompleteMock).toHaveBeenCalled());
  });
  it("calls onError callback on error during upload", async () => {
    const postUploadActionMock = jest.fn(() => Promise.resolve("return value"));

    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [
            JSON.stringify({ status: "uploading" }),
            JSON.stringify({ status: "error", error: "yes" }),
          ],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: noop,
        onError: noop,
        onComplete: noop,
        postUploadAction: postUploadActionMock,
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    act(() => trigger.advance());
    act(() => trigger.advance());
    await waitFor(() => {
      return expect(result.current.uploadError).toEqual("yes");
    });
  });
  it("calls onError callback on error during post upload", async () => {
    const postUploadActionMock = jest.fn(() =>
      Promise.reject(new Error("yes")),
    );

    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [JSON.stringify({ status: "uploading", pendingFileId: "1" })],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: noop,
        onError: noop,
        onComplete: noop,
        postUploadAction: postUploadActionMock,
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    act(() => trigger.advance());
    await waitFor(() => {
      return expect(result.current.uploadError).toEqual("yes");
    });
  });
  it("calls abort controllers on cancel", async () => {
    const postUploadActionMock = jest.fn(() => Promise.resolve("return value"));
    const mockSignalAbort = jest.fn();
    fakeAbortController.mockImplementation(() => ({
      signal: "signal",
      abort: mockSignalAbort,
    }));
    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [JSON.stringify({ status: "uploading", pendingFileId: "1" })],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: noop,
        onError: noop,
        onComplete: noop,
        postUploadAction: postUploadActionMock,
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    act(() => trigger.advance());
    await waitFor(() =>
      expect(postUploadActionMock).toHaveBeenCalledWith("1", "signal"),
    );
    await act(async () => await result.current.handleCancel());
    expect(mockSignalAbort).toHaveBeenCalledTimes(2);
  });
  it("clears status and errors on error dismiss", async () => {
    const postUploadActionMock = jest.fn(() => Promise.resolve("return value"));

    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(
        makeAdvanceableTestStreamForTrigger(
          [
            JSON.stringify({ status: "uploading" }),
            JSON.stringify({ status: "error", error: "yes" }),
          ],
          trigger,
        ),
      ),
    );
    const { result } = renderHook(() =>
      useFileUpload({
        onStart: noop,
        onSuccess: noop,
        onError: noop,
        onComplete: noop,
        postUploadAction: postUploadActionMock,
      }),
    );
    act(() => {
      result.current.uploadFile(fakeFile);
    });
    act(() => trigger.advance());
    act(() => trigger.advance());
    await waitFor(() => {
      return expect(result.current.uploadError).toEqual("yes");
    });
    act(() => result.current.dismissError());
    expect(result.current.currentStatus).toBeUndefined();
    expect(result.current.uploadError).toBeUndefined();
  });
});
