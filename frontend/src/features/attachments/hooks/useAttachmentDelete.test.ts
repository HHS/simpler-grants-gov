import { act, renderHook } from "@testing-library/react";
import { deleteAttachment as deleteAttachmentApi } from "src/features/attachments/api/deleteAttachments";
import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";

import { useAttachmentDelete } from "./useAttachmentDelete";

jest.mock("src/features/attachments/context/AttachmentsContext");
jest.mock("src/features/attachments/api/deleteAttachments");

const mockedUseAttachmentsContext = useAttachmentsContext as jest.Mock;
const mockedDeleteAttachmentApi = deleteAttachmentApi as jest.Mock;

describe("useAttachmentDelete", () => {
  const mockRemove = jest.fn();
  const mockRefresh = jest.fn();
  const mockSetDeletingIds = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAttachmentsContext.mockReturnValue({
      applicationId: "app-123",
      remove: mockRemove,
      refresh: mockRefresh,
      setDeletingIds: mockSetDeletingIds,
    });
  });

  it("should call deleteAttachmentApi, remove, refresh, and update deletingIds", async () => {
    mockedDeleteAttachmentApi.mockResolvedValueOnce(undefined);
    mockRefresh.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAttachmentDelete());

    await act(async () => {
      await result.current.deleteAttachment("attachment-1");
    });

    expect(mockSetDeletingIds).toHaveBeenCalledWith(expect.any(Function));
    expect(mockedDeleteAttachmentApi).toHaveBeenCalledWith({
      applicationId: "app-123",
      attachmentId: "attachment-1",
    });
    expect(mockRemove).toHaveBeenCalledWith("attachment-1");
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockSetDeletingIds).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should still call refresh and remove deletingId even if deleteAttachmentApi fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockedDeleteAttachmentApi.mockRejectedValueOnce(new Error("API failed"));
    mockRefresh.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAttachmentDelete());

    await act(async () => {
      await result.current.deleteAttachment("attachment-2");
    });

    expect(mockSetDeletingIds).toHaveBeenCalledTimes(2);
    expect(mockedDeleteAttachmentApi).toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it("should still remove deletingId even if refresh fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    mockedDeleteAttachmentApi.mockResolvedValueOnce(undefined);
    mockRefresh.mockRejectedValueOnce(new Error("Refresh failed"));

    const { result } = renderHook(() => useAttachmentDelete());

    await act(async () => {
      await result.current.deleteAttachment("attachment-3");
    });

    expect(mockedDeleteAttachmentApi).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockSetDeletingIds).toHaveBeenCalledTimes(2);

    consoleErrorSpy.mockRestore();
  });
});
