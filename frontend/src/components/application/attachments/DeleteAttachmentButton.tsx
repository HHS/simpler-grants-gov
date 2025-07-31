"use client";

import { Attachment } from "src/types/attachmentTypes";

import { RefObject } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

interface AttachmentDeleteButtonProps {
  buttonText: string;
  file: Attachment;
  markAttachmentForDeletion: (
    application_attachment_id: string,
    attachmentToDeleteName: string,
  ) => void;
  modalRef: RefObject<ModalRef | null>;
}

export const DeleteAttachmentButton = ({
  buttonText,
  file,
  markAttachmentForDeletion,
  modalRef,
}: AttachmentDeleteButtonProps) => {
  return (
    <ModalToggleButton
      disabled={false}
      modalRef={modalRef}
      opener
      className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
      data-testid="delete-attachment-modal-toggle-button"
      onClick={() =>
        markAttachmentForDeletion(
          file.application_attachment_id,
          file.file_name,
        )
      }
    >
      <USWDSIcon
        className="usa-icon margin-right-05 margin-left-neg-05"
        name="delete"
      />
      {buttonText}
    </ModalToggleButton>
  );
};
