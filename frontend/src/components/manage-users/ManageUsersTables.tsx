"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import type { UserDetail, UserRole } from "src/types/userTypes";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { UsersTable } from "src/components/manage-users/UserTable";
import { ConfirmRoleChangeModal } from "./ConfirmRoleChangeModal";

export interface ManageUsersTablesProps {
  organizationId: string;
  roles: UserRole[];
  activeUsers: UserDetail[];
  grantsGovUsers: UserDetail[];
  pendingUsers: UserDetail[];
  labels: {
    activeTitle: string;
    activeDescription: string;
    grantsTitle: string;
    grantsDescription: string;
    pendingTitle: string;
    pendingDescription: string;
  };
}

function getRoleId(role: UserRole): string {
  return (role as { role_id: string }).role_id;
}

export function ManageUsersTables({
  organizationId,
  roles,
  activeUsers,
  grantsGovUsers,
  pendingUsers,
  labels,
}: ManageUsersTablesProps) {
  const { clientFetch } = useClientFetch<UserDetail[]>(
    "Error fetching User Details",
  );
  const [rows, setRows] = useState<{ [key: string]: UserDetail[] }>({
    active: activeUsers,
    grants: grantsGovUsers,
    pending: pendingUsers,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingNextRoleId, setPendingNextRoleId] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<ModalRef>(null);

  useEffect(() => {
    if (!modalRef.current) return;
    modalRef.current.toggleModal(undefined, isDialogOpen);
  }, [isDialogOpen]);

  const onRequestRoleChange = useCallback(
    (userId: string, nextRoleId: string) => {
      setPendingUserId(userId);
      setPendingNextRoleId(nextRoleId);
      setIsDialogOpen(true);
    },
    [],
  );

  function closeDialog(): void {
    setIsDialogOpen(false);
    setPendingUserId("");
    setPendingNextRoleId("");
  }

  const confirmChange = useCallback(async () => {
    setIsSubmitting(true);
    setBusyUserId(pendingUserId);
    try {
      await clientFetch(
        `/api/user/organizations/${organizationId}/users/${pendingUserId}`,
        {
          method: "PUT",
          body: JSON.stringify({ role_ids: [pendingNextRoleId] }),
        },
      );

      setRows((previous) => {
        const updated: typeof previous = { ...previous };
        (Object.keys(updated) as Array<keyof typeof updated>).forEach((key) => {
          updated[key] = updated[key].map((user) =>
            user.user_id === pendingUserId
              ? {
                  ...user,
                  roles: roles.filter(
                    (role) => getRoleId(role) === pendingNextRoleId,
                  ),
                }
              : user,
          );
        });
        return updated;
      });

      closeDialog();
    } finally {
      setIsSubmitting(false);
      setBusyUserId(undefined);
    }
  }, [
    clientFetch,
    closeDialog,
    organizationId,
    pendingNextRoleId,
    pendingUserId,
    roles,
  ]);

  const confirmChangeRef = useRef(confirmChange);
  useEffect(() => {
    confirmChangeRef.current = confirmChange;
  }, [confirmChange]);

  const handleConfirm = useCallback(() => {
    confirmChangeRef.current().catch((error) => {
      console.error("Failed to confirm changes: ", error);
    });
  }, [confirmChange]);

  const nextRoleName =
    roles.find((role) => getRoleId(role) === pendingNextRoleId)?.role_name ??
    "";

  const modalHandlers = useMemo(
    () => ({
      onConfirm: handleConfirm,
      onCancel: closeDialog,
    }),
    [handleConfirm, closeDialog],
  );
  const tableHandlers = useMemo(
    () => ({ onRequestRoleChange }),
    [onRequestRoleChange],
  );
  return (
    <>
      <UsersTable
        users={rows.active}
        roles={roles}
        tableTitle={labels.activeTitle}
        tableDescription={labels.activeDescription}
        busyUserId={busyUserId}
        isSubmitting={isSubmitting}
        {...tableHandlers}
      />

      <UsersTable
        users={rows.grants}
        roles={roles}
        tableTitle={labels.grantsTitle}
        tableDescription={labels.grantsDescription}
        busyUserId={busyUserId}
        isSubmitting={isSubmitting}
        {...tableHandlers}
      />

      <UsersTable
        users={rows.pending}
        roles={roles}
        tableTitle={labels.pendingTitle}
        tableDescription={labels.pendingDescription}
        busyUserId={busyUserId}
        isSubmitting={isSubmitting}
        {...tableHandlers}
      />

      {isDialogOpen && (
        <ConfirmRoleChangeModal
          modalRef={modalRef}
          nextRoleName={nextRoleName}
          isSubmitting={isSubmitting}
          {...modalHandlers}
        />
      )}
    </>
  );
}
