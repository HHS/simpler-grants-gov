"use client";

import { useClientFetch } from "src/hooks/useClientFetch";

import { useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent } from "react";
import {
  FormGroup,
  Label,
  Select,
  type ModalRef,
} from "@trussworks/react-uswds";

import { RoleChangeModal } from "./RoleChangeModal";

interface RoleOption {
  value: string;
  label: string;
}

interface RoleManagerProps {
  organizationId: string;
  userId: string;
  currentRoleId: string;
  roleOptions: RoleOption[];
  disabled?: boolean;
}

export function RoleManager({
  organizationId,
  userId,
  currentRoleId,
  roleOptions,
  disabled = false,
}: RoleManagerProps) {
  const t = useTranslations("ManageUsers.roleManager");
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { clientFetch } = useClientFetch(t("errorState"));

  const modalRef = useRef<ModalRef | null>(null);

  const getRoleLabel = (roleId: string | null) =>
    roleId
      ? (roleOptions.find((r) => r.value === roleId)?.label ?? roleId)
      : "";

  const openModal = () => {
    setErrorMessage(null);
    modalRef.current?.toggleModal(undefined, true);
  };

  const closeModal = () => {
    modalRef.current?.toggleModal(undefined, false);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextRoleId = event.target.value;

    if (nextRoleId === selectedRoleId) return;

    setPendingRoleId(nextRoleId);
    openModal();
  };

  const handleCancel = () => {
    setPendingRoleId(null);
    setErrorMessage(null);
    closeModal();
  };

  const handleConfirm = async () => {
    if (!pendingRoleId) {
      closeModal();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await clientFetch(
        `/api/user/organizations/${organizationId}/users/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify({ role_ids: [pendingRoleId] }),
        },
      );

      setSelectedRoleId(pendingRoleId);
      setPendingRoleId(null);
      closeModal();
    } catch (error) {
      console.error("Failed to update user role", error);
      setErrorMessage(t("errorState"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectValue = pendingRoleId ?? selectedRoleId;
  const selectId = `role-select-${userId}`;

  return (
    <>
      <FormGroup className="margin-y-0">
        <Label htmlFor={selectId} className="usa-sr-only">
          {t("changeUserRole")}
        </Label>
        <Select
          id={selectId}
          name={selectId}
          value={selectValue}
          onChange={handleSelectChange}
          aria-label={t("changeUserRole")}
          disabled={disabled}
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </Select>
      </FormGroup>

      <RoleChangeModal
        isSubmitting={isSubmitting}
        modalRef={modalRef}
        nextRoleName={getRoleLabel(pendingRoleId)}
        onConfirm={() => {
          handleConfirm().catch((error) => {
            console.error("Failed to confirm role change", error);
          });
        }}
        onCancel={handleCancel}
        errorMessage={errorMessage}
      />
    </>
  );
}
