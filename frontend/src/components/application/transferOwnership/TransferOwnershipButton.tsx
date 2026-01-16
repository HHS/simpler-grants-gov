"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { ModalToggleButton, type ModalRef } from "@trussworks/react-uswds";

import { TransferOwnershipModal } from "src/components/application/transferOwnership/TransferOwnershipModal";
import { USWDSIcon } from "src/components/USWDSIcon";

type TransferOwnershipButtonProps = {
  applicationId: string;
};

export function TransferOwnershipButton({
  applicationId,
}: TransferOwnershipButtonProps) {
  const modalRef = useRef<ModalRef | null>(null);
  const modalId = "transfer-ownership-modal";
  const t = useTranslations("Application.information");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleOpen = useCallback((): void => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback((): void => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <ModalToggleButton
        modalRef={modalRef}
        opener
        onClick={handleOpen}
        className="usa-button usa-button--success margin-left-1"
        type="button"
        data-testid="transfer-ownership-open"
      >
        <USWDSIcon name="settings" /> {t("transferApplicaitonOwnership")}
      </ModalToggleButton>

      {isModalOpen && (
        <TransferOwnershipModal
          applicationId={applicationId}
          modalId={modalId}
          modalRef={modalRef}
          onAfterClose={handleClose}
        />
      )}
    </>
  );
}
