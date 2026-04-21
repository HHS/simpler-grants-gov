"use client";

import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  Alert,
  FileInput,
  FileInputRef,
  FormGroup,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { DeleteAttachmentModal } from "src/components/application/attachments/DeleteAttachmentModal";
import { USWDSIcon } from "src/components/USWDSIcon";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

interface UploadedFile {
  id: string;
  name: string;
  deletable: boolean;
}

interface OpportunityAttachmentUploadWidgetProps {
  opportunityId: string;
  initialAttachments?: OpportunityAttachment[];
  isDraft?: boolean;
}

export function OpportunityAttachmentUploadWidget({
  opportunityId,
  initialAttachments = [],
  isDraft = false,
}: OpportunityAttachmentUploadWidgetProps) {
  const t = useTranslations("OpportunityEdit.attachments");

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialAttachments.map((a) => ({
      id: a.opportunity_attachment_id || crypto.randomUUID(),
      name: a.file_name,
      deletable: !!a.opportunity_attachment_id,
    })),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);

  const handleFileChange = async (files: FileList | null): Promise<void> => {
    if (!files) return;
    setErrorMessage(null);
    setIsUploading(true);

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(t("errorFileTooLarge", { fileName: file.name }));
        continue;
      }

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
            {
              id: data.opportunity_attachment_id,
              name: file.name,
              deletable: true,
            },
          ]);
        } else {
          setErrorMessage(t("errorUploadFailed", { fileName: file.name }));
        }
      } catch (_err) {
        setErrorMessage(t("errorUploadFailed", { fileName: file.name }));
      }
    }

    setIsUploading(false);
    fileInputRef.current?.clearFiles();
  };

  const confirmDelete = async (): Promise<void> => {
    if (!fileToDelete) return;
    setErrorMessage(null);
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
        setErrorMessage(
          t("errorDeleteFailed", { fileName: fileToDelete.name }),
        );
      }
    } catch (_err) {
      setErrorMessage(
        t("errorDeleteFailed", { fileName: fileToDelete?.name ?? "" }),
      );
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <FormGroup>
      {errorMessage && (
        <Alert
          type="error"
          headingLevel="h4"
          heading={t("errorHeading")}
          className="margin-bottom-2"
        >
          {errorMessage}
        </Alert>
      )}

      <FileInput
        id="opportunity-attachment-upload"
        name="opportunity-attachment-upload"
        ref={fileInputRef}
        type="file"
        multiple
        disabled={isUploading || !isDraft}
        onChange={(e) => {
          handleFileChange(e.currentTarget.files).catch(() =>
            setErrorMessage(t("errorUploadFailed", { fileName: "" })),
          );
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
              {file.deletable && isDraft && (
                <ModalToggleButton
                  modalRef={deleteModalRef}
                  opener
                  className="usa-nav__link font-sans-sm display-flex flex-align-center text-secondary border-0"
                  onClick={() => setFileToDelete(file)}
                >
                  <USWDSIcon
                    className="usa-icon margin-right-05"
                    name="delete"
                  />
                  {t("removeButton")}
                </ModalToggleButton>
              )}
            </li>
          ))}
        </ul>
      )}

      <DeleteAttachmentModal
        deletePending={deletePending}
        handleDeleteAttachment={() => {
          confirmDelete().catch(() =>
            setErrorMessage(
              t("errorDeleteFailed", { fileName: fileToDelete?.name ?? "" }),
            ),
          );
        }}
        modalId="opportunity-attachment-delete-modal"
        modalRef={deleteModalRef}
        pendingDeleteName={fileToDelete?.name}
      />
    </FormGroup>
  );
}
