import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { noop } from "lodash";

import { FileUploadManager } from "./FileUploadManager";

const mockUseFileUpload = jest.fn();
const mockUploadFile = jest.fn();
const mockHandleCancel = jest.fn();
const mockDismissError = jest.fn();

const fakeFile = new File(["test content"], "test.txt", {
  type: "text/plain",
});

jest.mock("src/hooks/useFileUpload", () => ({
  useFileUpload: (...args: unknown[]) => mockUseFileUpload(...args) as unknown,
}));

describe("FileUploadManager", () => {
  beforeEach(() => {
    mockUseFileUpload.mockImplementation(() => ({
      currentStatus: "queued",
      uploadFile: mockUploadFile,
      handleCancel: mockHandleCancel,
      dismissError: mockDismissError,
    }));
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("calls useFileUpload with expected arguments", () => {
    const onStartMock = jest.fn();
    const onUploadSuccessMock = jest.fn();
    const onUploadErrorMock = jest.fn();
    const onCompleteMock = jest.fn();
    const postUploadActionMock = jest.fn(() => Promise.resolve());
    render(
      <FileUploadManager
        fileToUpload={fakeFile}
        postUploadActionProgressMessage="post upload action in progress"
        postUploadActionSuccessMessage="post upload action success"
        postUploadActionErrorMessage="post upload action error"
        onCancel={noop}
        onDismiss={noop}
        onStart={onStartMock}
        onUploadSuccess={onUploadSuccessMock}
        onUploadError={onUploadErrorMock}
        onComplete={onCompleteMock}
        postUploadAction={postUploadActionMock}
      />,
    );
    expect(mockUseFileUpload).toHaveBeenCalledWith({
      onStart: onStartMock,
      onSuccess: onUploadSuccessMock,
      onError: onUploadErrorMock,
      onComplete: onCompleteMock,
      postUploadAction: postUploadActionMock,
    });
  });
  it("calls both hook based and SimplerFileInput callbacks on cancel", async () => {
    const onCancelMock = jest.fn();
    render(
      <FileUploadManager
        fileToUpload={fakeFile}
        postUploadActionProgressMessage="post upload action in progress"
        postUploadActionSuccessMessage="post upload action success"
        postUploadActionErrorMessage="post upload action error"
        onCancel={onCancelMock}
        onDismiss={noop}
        onUploadSuccess={noop}
        onUploadError={noop}
        postUploadAction={jest.fn(() => Promise.resolve())}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "cancel" });
    expect(cancelButton).toBeInTheDocument();

    await userEvent.click(cancelButton);
    expect(onCancelMock).toHaveBeenCalled();
    expect(mockHandleCancel).toHaveBeenCalled();
  });
  it("calls both hook based and SimplerFileInput callbacks on dismiss", async () => {
    mockUseFileUpload.mockImplementation(() => ({
      currentStatus: "queued",
      uploadFile: mockUploadFile,
      handleCancel: mockHandleCancel,
      dismissError: mockDismissError,
      uploadError: "error",
    }));
    const onDismissMock = jest.fn();
    render(
      <FileUploadManager
        fileToUpload={fakeFile}
        postUploadActionProgressMessage="post upload action in progress"
        postUploadActionSuccessMessage="post upload action success"
        postUploadActionErrorMessage="post upload action error"
        onCancel={noop}
        onDismiss={onDismissMock}
        onUploadSuccess={noop}
        onUploadError={noop}
        postUploadAction={jest.fn(() => Promise.resolve())}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "dismiss" });
    expect(cancelButton).toBeInTheDocument();

    await userEvent.click(cancelButton);
    expect(onDismissMock).toHaveBeenCalled();
    expect(mockDismissError).toHaveBeenCalled();
  });
  it("calls uploadFile on mount", () => {
    render(
      <FileUploadManager
        fileToUpload={fakeFile}
        postUploadActionProgressMessage="post upload action in progress"
        postUploadActionSuccessMessage="post upload action success"
        postUploadActionErrorMessage="post upload action error"
        onCancel={noop}
        onDismiss={noop}
        onUploadSuccess={noop}
        onUploadError={noop}
        postUploadAction={jest.fn(() => Promise.resolve())}
      />,
    );
    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    expect(mockUploadFile).toHaveBeenCalledWith(fakeFile);
  });
});
