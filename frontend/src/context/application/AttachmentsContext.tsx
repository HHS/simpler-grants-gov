"use client";

import { Attachment } from "src/types/attachmentTypes";

import { useRouter } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { FileInputRef } from "@trussworks/react-uswds";

// ----------------------------- Context Shape -----------------------------
interface AttachmentsContextValue {
  attachments: Attachment[];
  fileInputRef: React.RefObject<FileInputRef | null>;
  pendingDeleteId: string | null;
  setPendingDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
  pendingDeleteName: string | null;
  setPendingDeleteName: React.Dispatch<React.SetStateAction<string | null>>;
  deletingIds: Set<string>;
  setDeletingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  /* CRUD helpers */
  refresh: () => Promise<void>;
  addUploading: (file: File, controller: AbortController) => string; // returns temp id
  upload: (
    file: File,
    tempId: string,
    controller: AbortController,
  ) => Promise<void>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  updateStatus: (id: string, status: "completed" | "failed") => void;
  remove: (id: string) => void;
}

const AttachmentsContext = createContext<AttachmentsContextValue | undefined>(
  undefined,
);

// --------------------------- Provider Component ---------------------------
interface ProviderProps {
  initialAttachments: Attachment[];
  applicationId: string;
  children: ReactNode;
}

export const AttachmentsProvider = ({
  initialAttachments,
  applicationId,
  children,
}: ProviderProps) => {
  const router = useRouter();
  const fileInputRef = useRef<FileInputRef | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>(
    initialAttachments ?? [],
  );

  // we use these pending values for the modal
  // pending ids
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(
    null,
  );

  // we use the deletingIds for after the user confirms deletion
  // actively deleting ids
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  /* util */
  const clearInputAndRefreshRoute = useCallback(() => {
    fileInputRef.current?.clearFiles();
    router.refresh();
  }, [router]);

  /* ------------------------------- refresh ------------------------------ */
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Attachment[];
      setAttachments(json);
    } catch (err) {
      console.error("refreshAttachments:", (err as Error).message);
    } finally {
      clearInputAndRefreshRoute();
    }
  }, [applicationId, clearInputAndRefreshRoute]);

  /* -------------------------- local state helpers ----------------------- */
  const updateStatus = useCallback(
    (id: string, status: "completed" | "failed") => {
      setAttachments((prev) =>
        prev.map((a) =>
          a.application_attachment_id === id ? { ...a, status } : a,
        ),
      );
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setAttachments((prev) =>
      prev.filter((a) => a.application_attachment_id !== id),
    );
  }, []);

  const addUploading = useCallback(
    (file: File, controller: AbortController): string => {
      const tempId = crypto.randomUUID();
      const temp: Attachment = {
        application_attachment_id: tempId,
        file_name: file.name,
        file_size_bytes: file.size,
        updated_at: new Date().toISOString(),
        status: "uploading",
        cancelToken: controller,
      } as Attachment;
      setAttachments((prev) => [temp, ...prev]);
      return tempId;
    },
    [],
  );

  /* ------------------------------ upload ------------------------------ */
  const upload = useCallback(
    async (file: File, tempId: string, controller: AbortController) => {
      const formData = new FormData();
      formData.append("file_attachment", file);
      try {
        const res = await fetch(
          `/api/applications/${applicationId}/attachments`,
          {
            method: "POST",
            body: formData,
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error("upload failed");
        updateStatus(tempId, "completed");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          remove(tempId);
        } else {
          updateStatus(tempId, "failed");
          console.error("uploadAttachment:", (err as Error).message);
        }
      } finally {
        await refresh();
      }
    },
    [applicationId, refresh, remove, updateStatus],
  );

  /* ------------------------------ delete ------------------------------ */
  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        const res = await fetch(
          `/api/applications/${applicationId}/attachments/${attachmentId}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        remove(attachmentId);
      } catch (err) {
        console.error("deleteAttachment:", (err as Error).message);
      } finally {
        await refresh();
      }
    },
    [applicationId, refresh, remove],
  );

  const value: AttachmentsContextValue = {
    attachments,
    fileInputRef,
    refresh,
    addUploading,
    upload,
    deleteAttachment,
    updateStatus,
    remove,
    pendingDeleteId,
    setPendingDeleteId,
    pendingDeleteName,
    setPendingDeleteName,
    deletingIds,
    setDeletingIds,
  };

  return (
    <AttachmentsContext.Provider value={value}>
      {children}
    </AttachmentsContext.Provider>
  );
};

// ---------------------------- consumer hooks -----------------------------
export const useAttachmentsCtx = () => {
  const ctx = useContext(AttachmentsContext);
  if (!ctx)
    throw new Error("useAttachmentsCtx must be inside AttachmentsProvider");
  return ctx;
};

export const useDeletingIds = () => useAttachmentsCtx().deletingIds;
export const useSetDeletingIds = () => useAttachmentsCtx().setDeletingIds;
export const usePendingDeleteId = () => useAttachmentsCtx().pendingDeleteId;
export const useSetPendingDeleteId = () =>
  useAttachmentsCtx().setPendingDeleteId;
export const usePendingDeleteName = () => useAttachmentsCtx().pendingDeleteName;
export const useSetPendingDeleteName = () =>
  useAttachmentsCtx().setPendingDeleteName;

export const useAttachmentsList = () => useAttachmentsCtx().attachments;
export const useUploadAttachment = () => {
  const { addUploading, upload } = useAttachmentsCtx();
  return async (file: File) => {
    const controller = new AbortController();
    const tempId = addUploading(file, controller);
    await upload(file, tempId, controller);
  };
};
export const useDeleteAttachment = () => useAttachmentsCtx().deleteAttachment;
export const useRefreshAttachments = () => useAttachmentsCtx().refresh;
export const useFileInputRef = () => useAttachmentsCtx().fileInputRef;
