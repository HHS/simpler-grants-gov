"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, type ModalRef } from "@trussworks/react-uswds";

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

  const handleAfterClose = useCallback((): void => {
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    modalRef.current?.toggleModal?.();
  }, [isModalOpen]);

  return (
    <>
      <Button
        type="button"
        onClick={handleOpen}
        className="usa-button usa-button--success margin-left-1"
        secondary
        data-testid="transfer-ownership-open"
      >
        <USWDSIcon name="settings" />
        {t("transferApplicaitonOwnership")}
      </Button>

      {isModalOpen && (
        <TransferOwnershipModal
          applicationId={applicationId}
          modalId={modalId}
          modalRef={modalRef}
          onAfterClose={handleAfterClose}
        />
      )}
    </>
  );
}
