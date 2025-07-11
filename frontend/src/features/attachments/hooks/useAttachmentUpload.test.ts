/* eslint-disable import/first */
jest.mock("src/features/attachments/api/uploadAttachment");
jest.mock("src/features/attachments/context/AttachmentsContext");

import { act, renderHook } from "@testing-library/react";
import { uploadAttachment as mockUploadAttachmentAPI } from "src/features/attachments/api/uploadAttachment";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";

import { useAttachmentUpload } from "./useAttachmentUpload";

const mockUploadAttachment = mockUploadAttachmentAPI as jest.Mock;

describe("useAttachmentUpload", () => {
  const mockAddUploading = jest.fn();
  const mockUpdateStatus = jest.fn();
  const mockRemove = jest.fn();
  const mockRefresh = jest.fn();

  const tempId = "temp-id";

  const setup = () => {
    (useAttachmentsContext as jest.Mock).mockReturnValue({
      applicationId: "app-456",
      addUploading: mockAddUploading,
      updateStatus: mockUpdateStatus,
      remove: mockRemove,
      refresh: mockRefresh,
    });

    mockAddUploading.mockReturnValue(tempId);
    mockRefresh.mockResolvedValue(undefined);

    return renderHook(() => useAttachmentUpload());
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uploads successfully and updates status", async () => {
    mockUploadAttachment.mockResolvedValueOnce(undefined);

    const { result } = setup();

    const file = new File(["test"], "test.txt", { type: "text/plain" });

    await act(() => {
      result.current.uploadAttachment(file);
      return Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockAddUploading).toHaveBeenCalledWith(
      file,
      expect.any(AbortController),
    );
    expect(mockUploadAttachment).toHaveBeenCalledWith({
      applicationId: "app-456",
      file,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      signal: expect.any(AbortSignal),
    });
    expect(mockUpdateStatus).toHaveBeenCalledWith(tempId, "completed");
    expect(mockRefresh).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAborted).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("handles API failure and sets error state", async () => {
    const error = new Error("Upload failed");
    mockUploadAttachment.mockRejectedValueOnce(error);

    const { result } = setup();

    const file = new File(["fail"], "fail.txt", { type: "text/plain" });

    await act(() => {
      result.current.uploadAttachment(file);
      return Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockUpdateStatus).toHaveBeenCalledWith(tempId, "failed");
    expect(result.current.error).toEqual(error);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles aborts correctly", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    mockUploadAttachment.mockRejectedValueOnce(abortError);

    const { result } = setup();

    const file = new File(["cancel"], "cancel.txt", { type: "text/plain" });

    await act(() => {
      const controller = result.current.uploadAttachment(file);
      controller.abort();
      return Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockRemove).toHaveBeenCalledWith(tempId);
    expect(result.current.isAborted).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("catches and suppresses refresh errors", async () => {
    mockUploadAttachment.mockResolvedValueOnce(undefined);
    mockRefresh.mockRejectedValueOnce(new Error("Refresh failed"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const { result } = setup();
    const file = new File(["refresh"], "refresh.txt", { type: "text/plain" });

    await act(() => {
      result.current.uploadAttachment(file);
      return Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockUpdateStatus).toHaveBeenCalledWith(tempId, "completed");
    expect(mockRefresh).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });
});
