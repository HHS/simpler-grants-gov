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

import { SimplerModal } from "src/components/core/SimplerModal";
import Spinner from "src/components/core/Spinner";

interface Props {
  deletePending: boolean;
  handleDeleteFile: () => void;
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
  pendingDeleteName: string | undefined;
  confirmationMessage?: string;
}

export const DeleteFileModal = ({
  deletePending,
  handleDeleteFile,
  modalId,
  modalRef,
  pendingDeleteName,
  confirmationMessage,
}: Props) => {
  const t = useTranslations("FileInput.deleteModal");
  const descriptionText = confirmationMessage ?? t("descriptionText");
  return (
    <SimplerModal
      modalId={modalId}
      modalRef={modalRef}
      titleText={
        pendingDeleteName
          ? `${t("titleText")} ${pendingDeleteName}?`
          : t("cautionDeletingAttachment")
      }
      className="text-wrap"
    >
      <p className="font-sans-2xs margin-y-4">{descriptionText}</p>
      <ModalFooter>
        <ButtonGroup>
          <Button
            disabled={deletePending}
            type="button"
            onClick={handleDeleteFile}
          >
            {deletePending ? (
              <>
                <Spinner className="sm" />
                {t("deleting")}
              </>
            ) : (
              t("deleteFileCta")
            )}
          </Button>
          <ModalToggleButton
            className="padding-105 text-center"
            closer
            disabled={deletePending}
            modalRef={modalRef}
            unstyled
          >
            {t("cancelDeleteCta")}
          </ModalToggleButton>
        </ButtonGroup>
      </ModalFooter>
    </SimplerModal>
  );
};
