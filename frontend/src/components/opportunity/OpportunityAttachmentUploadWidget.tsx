"use client";

import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";

import { useRef, useState } from "react";
import {
  FileInput,
  FileInputRef,
  FormGroup,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { DeleteAttachmentModal } from "src/components/application/attachments/DeleteAttachmentModal";
import { USWDSIcon } from "src/components/USWDSIcon";

interface UploadedFile {
  id: string;
  name: string;
}

interface Props {
  opportunityId: string;
  initialAttachments?: OpportunityAttachment[];
}

export function OpportunityAttachmentUploadWidget({
  opportunityId,
  initialAttachments = [],
}: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialAttachments.map((a) => ({
      id: a.opportunity_attachment_id,
      name: a.file_name,
    })),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);

  const handleFileChange = async (files: FileList | null): Promise<void> => {
    if (!files) return;
    setIsUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(
          `/api/opportunities/${opportunityId}/attachments`,
          { method: "POST", body: formData },
        );
        if (res.ok) {
          const data = (await res.json()) as {
            opportunity_attachment_id: string;
          };
          setUploadedFiles((prev) => [
            ...prev,
            { id: data.opportunity_attachment_id, name: file.name },
          ]);
        } else {
          console.error("Failed to upload file:", file.name);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setIsUploading(false);
    fileInputRef.current?.clearFiles();
  };

  const confirmDelete = async (): Promise<void> => {
    if (!fileToDelete) return;
    setDeletePending(true);

    try {
      const res = await fetch(
        `/api/opportunities/${opportunityId}/attachments/${fileToDelete.id}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setUploadedFiles((prev) =>
          prev.filter((f) => f.id !== fileToDelete.id),
        );
        setFileToDelete(null);
        deleteModalRef.current?.toggleModal();
      } else {
        console.error("Failed to delete file:", fileToDelete.name);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <FormGroup>
      <FileInput
        id="opportunity-attachment-upload"
        name="opportunity-attachment-upload"
        ref={fileInputRef}
        type="file"
        multiple
        disabled={isUploading}
        onChange={(e) => {
          handleFileChange(e.currentTarget.files).catch(console.error);
        }}
      />

      {uploadedFiles.length > 0 && (
        <ul className="usa-list usa-list--unstyled margin-top-2">
          {uploadedFiles.map((file) => (
            <li
              key={file.id}
              className="display-flex flex-align-center padding-y-1 border-bottom border-base-lighter"
            >
              <span className="flex-fill font-sans-sm">{file.name}</span>
              <ModalToggleButton
                modalRef={deleteModalRef}
                opener
                className="usa-nav__link font-sans-sm display-flex flex-align-center text-secondary border-0"
                onClick={() => setFileToDelete(file)}
              >
                <USWDSIcon className="usa-icon margin-right-05" name="delete" />
                Remove
              </ModalToggleButton>
            </li>
          ))}
        </ul>
      )}

      <DeleteAttachmentModal
        deletePending={deletePending}
        handleDeleteAttachment={() => {
          confirmDelete().catch(console.error);
        }}
        modalId="opportunity-attachment-delete-modal"
        modalRef={deleteModalRef}
        pendingDeleteName={fileToDelete?.name}
      />
    </FormGroup>
  );
}
