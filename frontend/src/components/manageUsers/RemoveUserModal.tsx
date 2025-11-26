"use client";

import { useTranslations } from "next-intl";
import React, { RefObject } from "react";
import {
  Alert,
  Button,
  ButtonGroup,
  ModalFooter,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";

export interface RemoveUserModalProps {
  isSubmitting: boolean;
  modalRef: RefObject<ModalRef | null>;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  errorMessage?: string | null;
}

export function RemoveUserModal({
  isSubmitting,
  modalRef,
  userName,
  onConfirm,
  onCancel,
  errorMessage,
}: RemoveUserModalProps) {
  const t = useTranslations("ManageUsers.removeUserModal");
  const modalTitle = t("header");
  const modalDescription = t("description", { name: userName });

  return (
    <SimplerModal
      modalId="confirmation-remove-user-modal"
      modalRef={modalRef}
      titleText={modalTitle}
      className="text-wrap"
    >
      <p className="font-sans-2xs margin-y-4">{modalDescription}</p>

      {errorMessage && (
        <div className="margin-bottom-2">
          <Alert
            slim
            type="error"
            noIcon
            headingLevel="h6"
            role="alert"
            data-testid="remove-user-error"
          >
            {errorMessage}
          </Alert>
        </div>
      )}

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
                <span>{t("removing")}</span>
                <span
                  className="margin-left-1 usa-spinner usa-spinner--small"
                  role="status"
                  aria-hidden
                />
              </span>
            ) : (
              t("removeUser")
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
