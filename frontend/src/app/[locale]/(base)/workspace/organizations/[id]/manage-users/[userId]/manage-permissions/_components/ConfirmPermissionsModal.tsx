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

const MODAL_ID = "confirm-permission-updates-modal";

export function ConfirmPermissionsModal({
  modalRef,
  onConfirm,
}: {
  modalRef: RefObject<ModalRef | null>;
  onConfirm: () => void;
}) {
  const t = useTranslations("ManagePermissions.confirmModal");

  return (
    <SimplerModal
      modalId={MODAL_ID}
      modalRef={modalRef}
      titleText={t("heading")}
      descriptionId={`${MODAL_ID}-description`}
      className="text-wrap"
    >
      <p id={`${MODAL_ID}-description`} className="font-sans-2xs margin-y-4">
        {t("description")}
      </p>
      <ModalFooter>
        <ButtonGroup>
          <Button
            type="button"
            onClick={onConfirm}
            data-testid="confirm-permission-updates"
          >
            {t("confirm")}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
          >
            {t("cancel")}
          </ModalToggleButton>
        </ButtonGroup>
      </ModalFooter>
    </SimplerModal>
  );
}
