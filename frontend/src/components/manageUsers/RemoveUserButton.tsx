"use client";

import { useClientFetch } from "src/hooks/useClientFetch";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { Button, type ModalRef } from "@trussworks/react-uswds";

import { RemoveUserModal } from "src/components/manageUsers/RemoveUserModal";

interface RemoveUserButtonProps {
  organizationId: string;
  userId: string;
  userName: string;
}

export function RemoveUserButton({
  organizationId,
  userId,
  userName,
}: RemoveUserButtonProps) {
  const t = useTranslations("ManageUsers.removeUserModal");
  const router = useRouter();
  const { clientFetch } = useClientFetch(
    "Unable to remove user from active roster",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const modalRef = useRef<ModalRef | null>(null);

  const openModal = () => {
    setErrorMessage(null);
    modalRef.current?.toggleModal();
  };

  const closeModal = () => {
    modalRef.current?.toggleModal();
  };

  const handleRemove = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await clientFetch(
        `/api/user/organizations/${organizationId}/users/${userId}`,
        {
          method: "DELETE",
        },
      );

      closeModal();
      router.refresh();
    } catch (error) {
      console.error("Failed to remove user", error);

      const message =
        error instanceof Error
          ? error.message
          : "We couldn't remove this user. Please try again.";
      setErrorMessage(message);
      // TODO: discuss with design
      // Modal stays open so the error is visible
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button type="button" unstyled onClick={openModal}>
        {t("removeUser")}
      </Button>
      <RemoveUserModal
        isSubmitting={isSubmitting}
        modalRef={modalRef}
        userName={userName}
        onConfirm={() => {
          handleRemove().catch((error) => {
            console.error("Failed to confirm removal", error);
          });
        }}
        onCancel={closeModal}
        errorMessage={errorMessage}
      />
    </>
  );
}
