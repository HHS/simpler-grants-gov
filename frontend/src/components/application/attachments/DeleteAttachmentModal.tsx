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
  deletePending: boolean;
  handleDeleteAttachment: () => void;
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
  pendingDeleteName: string | undefined;
}

export const DeleteAttachmentModal = ({
  deletePending,
  handleDeleteAttachment,
  modalId,
  modalRef,
  pendingDeleteName,
}: Props) => {
  const t = useTranslations("Application.attachments.deleteModal");
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
      <p className="font-sans-2xs margin-y-4">{t("descriptionText")}</p>
      <ModalFooter>
        <ButtonGroup>
          <Button
            disabled={deletePending}
            type="button"
            onClick={handleDeleteAttachment}
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
