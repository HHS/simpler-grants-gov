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
  // for now, allowing the ID to be optional. As the SimplerFileInput is rolled out, this component
  // will only be used there, where it is required, so we can adjust at that time
  // or can we do this without the id, and rely on the parent to know about the id, yeah probably
  handleDeleteFile: () => void;
  deletePending: boolean;
  modalId: string;
  modalRef: RefObject<ModalRef | null>;
  pendingDeleteName: string | undefined;
}

export const DeleteFileModal = ({
  deletePending,
  handleDeleteFile,
  modalId,
  modalRef,
  pendingDeleteName,
}: Props) => {
  const t = useTranslations("FileInput.deleteModal");
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
