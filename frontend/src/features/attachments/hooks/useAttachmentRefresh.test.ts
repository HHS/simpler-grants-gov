/* eslint-disable import/first */
jest.mock("src/features/attachments/api/getAttachments");

import { act, renderHook } from "@testing-library/react";
import { getAttachments } from "src/features/attachments/api/getAttachments";
import { Attachment } from "src/types/attachmentTypes";

import { RefObject } from "react";
import { FileInputRef } from "@trussworks/react-uswds";

import { useAttachmentRefresh } from "./useAttachmentRefresh";

const mockedGetAttachments = getAttachments as jest.Mock;

describe("useAttachmentRefresh", () => {
  const mockSetAttachments = jest.fn();
  const mockClearFiles = jest.fn();

  const fileInputRef: React.RefObject<FileInputRef> = {
    current: {
      clearFiles: mockClearFiles,
      input: null,
      files: [],
    },
  };

  const sampleAttachments: Attachment[] = [
    {
      application_attachment_id: "1",
      download_path: "/download/1",
      created_at: "2023-01-01T00:00:00Z",
      file_name: "doc1.pdf",
      file_size_bytes: 123456,
      mime_type: "application/pdf",
      updated_at: "2023-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches attachments and sets them, then clears the file input", async () => {
    mockedGetAttachments.mockResolvedValueOnce(sampleAttachments);

    const { result } = renderHook(() =>
      useAttachmentRefresh({
        applicationId: "app-123",
        setAttachments: mockSetAttachments,
        fileInputRef,
      }),
    );

    await act(async () => {
      await result.current();
    });

    expect(mockedGetAttachments).toHaveBeenCalledWith({
      applicationId: "app-123",
    });
    expect(mockSetAttachments).toHaveBeenCalledWith(sampleAttachments);
    expect(mockClearFiles).toHaveBeenCalled();
  });

  it("still clears the file input even if getAttachments fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    mockedGetAttachments.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() =>
      useAttachmentRefresh({
        applicationId: "app-123",
        setAttachments: mockSetAttachments,
        fileInputRef,
      }),
    );

    await act(async () => {
      await result.current();
    });

    expect(mockedGetAttachments).toHaveBeenCalled();
    expect(mockSetAttachments).not.toHaveBeenCalled();
    expect(mockClearFiles).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("does not throw if clearFiles is undefined", async () => {
    const fileInputRefWithoutClear = {
      current: {},
    } as RefObject<FileInputRef | null>;

    mockedGetAttachments.mockResolvedValueOnce(sampleAttachments);

    const { result } = renderHook(() =>
      useAttachmentRefresh({
        applicationId: "app-123",
        setAttachments: mockSetAttachments,
        fileInputRef: fileInputRefWithoutClear,
      }),
    );

    await act(async () => {
      await result.current();
    });

    expect(mockedGetAttachments).toHaveBeenCalled();
    expect(mockSetAttachments).toHaveBeenCalled();
  });

  it("returns a stable function reference (useCallback)", () => {
    const { result, rerender } = renderHook(
      ({ id }) =>
        useAttachmentRefresh({
          applicationId: id,
          setAttachments: mockSetAttachments,
          fileInputRef,
        }),
      {
        initialProps: { id: "app-123" },
      },
    );

    const first = result.current;

    rerender({ id: "app-123" });

    expect(result.current).toBe(first);
  });
});
