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

import { LoadingButton } from "src/components/LoadingButton";
import { SimplerModal } from "src/components/SimplerModal";

export interface RoleChangeModalProps {
  isSubmitting: boolean;
  modalRef: RefObject<ModalRef | null>;
  nextRoleName: string;
  onConfirm: () => void;
  onCancel: () => void;
  errorMessage?: string | null;
}

export function RoleChangeModal({
  isSubmitting,
  modalRef,
  nextRoleName,
  onConfirm,
  onCancel,
  errorMessage,
}: RoleChangeModalProps) {
  const t = useTranslations("ManageUsers.confirmationModal");
  const modalTitle = t("header");
  const modalDescription = `${t("description")} ${nextRoleName}?`;

  return (
    <SimplerModal
      modalId="confirmation-role-change-modal"
      modalRef={modalRef}
      titleText={modalTitle}
      className="text-wrap"
      onClose={onCancel}
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
            data-testid="role-change-error"
          >
            {errorMessage}
          </Alert>
        </div>
      )}

      <ModalFooter>
        <ButtonGroup>
          {isSubmitting ? (
            <LoadingButton
              id="role-change-confirm-button"
              message={t("saving")}
            />
          ) : (
            <Button type="button" onClick={onConfirm}>
              {t("confirm")}
            </Button>
          )}
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
