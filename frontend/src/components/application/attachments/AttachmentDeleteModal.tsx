// AttachmentDeleteModal.tsx – context‑aware version
"use client";

import {
  useDeleteAttachment,
  usePendingDeleteId,
  usePendingDeleteName,
  useSetDeletingIds,
} from "src/context/application/AttachmentsContext";

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
  /** modal infra */
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
  const pendingDeleteId = usePendingDeleteId();
  const pendingDeleteName = usePendingDeleteName();
  const deleteAttachment = useDeleteAttachment();
  const setDeletingIds = useSetDeletingIds();

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingIds((prev) => new Set(prev).add(pendingDeleteId));
    await deleteAttachment(pendingDeleteId).finally(() =>
      modalRef.current?.toggleModal(),
    );
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
          <Button
            type="button"
            onClick={() => handleDelete() as unknown as void}
          >
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
