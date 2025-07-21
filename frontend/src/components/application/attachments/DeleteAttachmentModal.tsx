"use client";

import { useTranslations } from "next-intl";
import { RefObject } from "react";
import {
  Button,
  ButtonGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";
import Spinner from "src/components/Spinner";

interface Props {
  buttonCtaText: string;
  cancelCtaText: string;
  deletePending: boolean;
  descriptionText: string;
  handleConfirmedDelete: () => void;
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
  pendingDeleteName: string | undefined;
  titleText: string;
}

export const DeleteAttachmentModal = ({
  buttonCtaText,
  cancelCtaText,
  deletePending,
  descriptionText,
  handleConfirmedDelete,
  modalId,
  modalRef,
  pendingDeleteName,
  titleText,
}: Props) => {
  const t = useTranslations("Application.attachments");
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
            disabled={deletePending}
            type="button"
            onClick={handleConfirmedDelete}
          >
            {deletePending ? (
              <>
                <Spinner className="sm" />
                {t("deleting")}
              </>
            ) : (
              buttonCtaText
            )}
          </Button>
          <ModalToggleButton
            className="padding-105 text-center"
            closer
            disabled={deletePending}
            modalRef={modalRef}
            unstyled
          >
            {cancelCtaText}
          </ModalToggleButton>
        </ButtonGroup>
      </ModalFooter>
    </SimplerModal>
  );
};
