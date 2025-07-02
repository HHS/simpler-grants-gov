"use client";

import {
  useDeletingIds,
  usePendingDeleteId,
  usePendingDeleteName,
  useSetPendingDeleteId,
  useSetPendingDeleteName,
} from "src/context/application/AttachmentsContext";
import { Attachment } from "src/types/attachmentTypes";

import { RefObject } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

interface Props {
  buttonText: string;
  file: Attachment;
  modalRef: RefObject<ModalRef | null>;
}

export const AttachmentDeleteButton = ({
  buttonText,
  file,
  modalRef,
}: Props) => {
  const pendingDeleteId = usePendingDeleteId();
  const pendingDeleteName = usePendingDeleteName();
  const setPendingDeleteId = useSetPendingDeleteId();
  const setPendingDeleteName = useSetPendingDeleteName();
  const deletingIds = useDeletingIds();

  const setFileToDeleteData = (fileName: string, id: string) => {
    setPendingDeleteName(fileName);
    setPendingDeleteId(id);
  };

  return (
    <ModalToggleButton
      disabled={deletingIds.has(file.application_attachment_id)}
      modalRef={modalRef}
      opener
      className="usa-nav__link font-sans-2xs display-flex text-normal border-0"
      data-testid="delete-attachment-modal-toggle-button"
      onClick={() =>
        setFileToDeleteData(file.file_name, file.application_attachment_id)
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
