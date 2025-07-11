"use client";

import { useAttachmentsContext } from "src/features/attachments/context/AttachmentsContext";
import { useAttachmentDelete } from "src/features/attachments/hooks/useAttachmentDelete";

import { RefObject } from "react";
import {
  Button,
  ButtonGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";

interface Props {
  titleText: string;
  descriptionText: string;
  cancelCtaText: string;
  buttonCtaText: string;
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
}

export const AttachmentDeleteModal = ({
  titleText,
  descriptionText,
  cancelCtaText,
  buttonCtaText,
  modalId,
  modalRef,
}: Props) => {
  const { pendingDeleteId, pendingDeleteName, setDeletingIds } =
    useAttachmentsContext();
  const { deleteAttachment } = useAttachmentDelete();

  const handleDelete = () => {
    if (!pendingDeleteId) return;
    setDeletingIds((prev) => new Set(prev).add(pendingDeleteId));
    modalRef.current?.toggleModal();
    // eslint-disable-next-line no-void
    void deleteAttachment(pendingDeleteId).catch((e) => console.error(e));
  };

  return (
    <SimplerModal
      modalId={modalId}
      modalRef={modalRef}
      titleText={
        pendingDeleteName
          ? `${titleText} ${pendingDeleteName}?`
          : "Caution, deleting attachment"
      }
      className="text-wrap"
    >
      <p className="font-sans-2xs margin-y-4">{descriptionText}</p>
      <ModalFooter>
        <ButtonGroup>
          <Button type="button" onClick={handleDelete}>
            {buttonCtaText}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
          >
            {cancelCtaText}
          </ModalToggleButton>
        </ButtonGroup>
      </ModalFooter>
    </SimplerModal>
  );
};
