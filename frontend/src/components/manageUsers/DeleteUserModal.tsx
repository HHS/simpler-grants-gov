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

export interface DeleteUserModalProps {
  isSubmitting: boolean;
  modalRef: RefObject<ModalRef | null>;
  userDisplayName: string; // e.g. "Ada Lovelace (ada@example.com)"
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteUserModal({
  isSubmitting,
  modalRef,
  userDisplayName,
  onConfirm,
  onCancel,
}: DeleteUserModalProps) {
  const t = useTranslations("ManageUsers.deleteUserModal");
  const modalTitle = t("header");
  const modalDescription = `${t("description")} ${userDisplayName}?`;

  return (
    <SimplerModal
      modalId="confirmation-delete-user-modal"
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
            className="usa-button usa-button--secondary"
          >
            {isSubmitting ? (
              <span className="display-inline-flex flex-align-center">
                <span>{t("deleting")}</span>
                <span
                  className="margin-left-1 usa-spinner usa-spinner--small"
                  role="status"
                  aria-hidden
                />
              </span>
            ) : (
              t("delete")
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
