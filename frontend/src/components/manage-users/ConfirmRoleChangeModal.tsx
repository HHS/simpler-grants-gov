"use client";

import { useTranslations } from "next-intl";
import React, { RefObject } from "react";
import {
  Button,
  ButtonGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";

export interface ConfirmRoleChangeModalProps {
  isSubmitting: boolean;
  modalRef: RefObject<ModalRef | null>;
  nextRoleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmRoleChangeModal({
  isSubmitting,
  modalRef,
  nextRoleName,
  onConfirm,
  onCancel,
}: ConfirmRoleChangeModalProps) {
  const t = useTranslations("ManageUsers.confirmationModal");
  const modalTitle = t("header");
  const modalDescription = `${t("description")} ${nextRoleName}?`;

  return (
    <SimplerModal
      modalId="confirmation-role-change-modal"
      modalRef={modalRef}
      titleText={modalTitle}
      className="text-wrap"
    >
      <p className="font-sans-2xs margin-y-4">{modalDescription}</p>
      <ModalFooter>
        <ButtonGroup>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span className="display-inline-flex flex-align-center">
                <span>{t("saving")}</span>
                <span
                  className="margin-left-1 usa-spinner usa-spinner--small"
                  role="status"
                  aria-hidden
                />
              </span>
            ) : (
              t("confirm")
            )}
          </Button>
          <ModalToggleButton
            modalRef={modalRef}
            closer
            unstyled
            className="padding-105 text-center"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {t("cancel")}
          </ModalToggleButton>
        </ButtonGroup>
      </ModalFooter>
    </SimplerModal>
  );
}
