"use client";

import { useAttachmentRefresh } from "src/features/attachments/hooks/useAttachmentRefresh";
import { Attachment } from "src/types/attachmentTypes";
import { v4 as uuidv4 } from "uuid";

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

interface AttachmentsContextValue {
  applicationId: string;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  pendingDeleteId: string | null;
  setPendingDeleteId: React.Dispatch<React.SetStateAction<string | null>>;
  pendingDeleteName: string | null;
  setPendingDeleteName: React.Dispatch<React.SetStateAction<string | null>>;
  deletingIds: Set<string>;
  setDeletingIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  fileInputRef: React.RefObject<FileInputRef | null>;
  refresh: () => Promise<void>;
  addUploading: (file: File, controller: AbortController) => string; // returns temp id
  updateStatus: (id: string, status: "completed" | "failed") => void;
  remove: (id: string) => void;
}

const AttachmentsContext = createContext<AttachmentsContextValue | undefined>(
  undefined,
);

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

  const [attachments, setAttachments] =
    useState<Attachment[]>(initialAttachments);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(
    null,
  );
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const getAttachments = useAttachmentRefresh({
    applicationId,
    setAttachments,
    fileInputRef,
  });

  const clearInputAndRefreshRoute = useCallback(() => {
    fileInputRef.current?.clearFiles();
    router.refresh();
  }, [router]);

  const refresh = useCallback(async () => {
    await getAttachments();
    clearInputAndRefreshRoute();
  }, [getAttachments, clearInputAndRefreshRoute]);

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
      const tempId = uuidv4();
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

  const value: AttachmentsContextValue = {
    applicationId,
    attachments,
    setAttachments,
    pendingDeleteId,
    setPendingDeleteId,
    pendingDeleteName,
    setPendingDeleteName,
    deletingIds,
    setDeletingIds,
    fileInputRef,
    refresh,
    addUploading,
    updateStatus,
    remove,
  };

  return (
    <AttachmentsContext.Provider value={value}>
      {children}
    </AttachmentsContext.Provider>
  );
};

export const useAttachmentsContext = () => {
  const ctx = useContext(AttachmentsContext);
  if (!ctx)
    throw new Error(
      "useAttachmentsContext must be used within AttachmentsProvider",
    );
  return ctx;
};
