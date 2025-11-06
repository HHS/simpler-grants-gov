"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import type { UserDetail, UserRole } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { ActiveUsers } from "./ActiveUsers";
import { ConfirmRoleChangeModal } from "./ConfirmRoleChangeModal";
import { LegacySystemUsers } from "./LegacySystemUsers";
import { PendingUsers } from "./PendingUsers";

type Bucket = "active" | "legacy" | "pending";

export interface ManageUsersClientProps {
  organizationId: string;
  roles: UserRole[];
  activeUsers: UserDetail[];
  legacySystemUsers: UserDetail[];
  pendingUsers: UserDetail[];
}

function getRoleId(role: UserRole): string {
  return (role as { role_id: string }).role_id;
}

export function ManageUsersClient({
  organizationId,
  roles,
  activeUsers,
  legacySystemUsers,
  pendingUsers,
}: ManageUsersClientProps) {
  const t = useTranslations("ManageUsers");
  // Local copy of users split into buckets.
  // We keep this in client state so we can:
  // - Optimistically update role changes
  // - Avoid blanking out a row when the API response doesn't
  //   include the full user object (only updated roles, etc.)
  const [rows, setRows] = useState<{
    active: UserDetail[];
    legacy: UserDetail[];
    pending: UserDetail[];
  }>({
    active: activeUsers,
    legacy: legacySystemUsers,
    pending: pendingUsers,
  });

  // Keep local state in sync if the server ever re-fetches data.
  //
  // This lets us:
  // - Start with server-fetched users
  // - Apply local optimistic updates
  // - Then "snap back" to the canonical data if the page is refreshed or
  //   the parent re-renders with new props.
  useEffect(() => {
    setRows({
      active: activeUsers,
      legacy: legacySystemUsers,
      pending: pendingUsers,
    });
  }, [activeUsers, legacySystemUsers, pendingUsers]);

  // Modal state
  const [pendingUserId, setPendingUserId] = useState<string>("");
  const [pendingNextRoleId, setPendingNextRoleId] = useState<string>("");
  const [pendingBucket, setPendingBucket] = useState<Bucket | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef: RefObject<ModalRef | null> = useRef<ModalRef | null>(null);

  const { clientFetch } = useClientFetch<UserDetail>(
    "Error updating user role",
  );

  const handleRequestRoleChange = useCallback(
    (bucket: Bucket, userId: string, nextRoleId: string) => {
      setPendingBucket(bucket);
      setPendingUserId(userId);
      setPendingNextRoleId(nextRoleId);
      modalRef.current?.toggleModal(undefined, true);
    },
    [],
  );

  const handleCloseDialog = useCallback(() => {
    modalRef.current?.toggleModal(undefined, false);
    setPendingBucket(null);
    setPendingUserId("");
    setPendingNextRoleId("");
  }, []);

  const handleConfirmChange = useCallback(async () => {
    if (!pendingBucket || !pendingUserId || !pendingNextRoleId) {
      handleCloseDialog();
      return;
    }

    setIsSubmitting(true);
    setBusyUserId(pendingUserId);

    try {
      const updatedRoles = await clientFetch(
        `/api/user/organizations/${organizationId}/users/${pendingUserId}`,
        {
          method: "PUT",
          body: JSON.stringify({ role_ids: [pendingNextRoleId] }),
        },
      );

      if (updatedRoles) {
        setRows((prev) => {
          const bucketRows = prev[pendingBucket] ?? [];
          // NOTE: API does *not* return a full user object here.
          // It only returns the new roles (or partial data).
          // To avoid wiping out email/name/etc., we merge the new
          // data into the existing user instead of replacing it.
          return {
            ...prev,
            [pendingBucket]: bucketRows.map((user) =>
              user.user_id === pendingUserId
                ? {
                    ...user,
                    roles: updatedRoles,
                  }
                : user,
            ),
          };
        });
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Failed to update user role", error);
    } finally {
      setIsSubmitting(false);
      setBusyUserId(undefined);
    }
  }, [
    clientFetch,
    handleCloseDialog,
    organizationId,
    pendingBucket,
    pendingNextRoleId,
    pendingUserId,
  ]);

  const handleConfirmClick = useCallback(() => {
    handleConfirmChange().catch((error) => {
      console.error("Failed to confirm role change", error);
    });
  }, [handleConfirmChange]);

  const nextRoleName = useMemo(() => {
    const match = roles.find((r) => getRoleId(r) === pendingNextRoleId);
    return match?.role_name ?? "";
  }, [roles, pendingNextRoleId]);

  const handleActiveRoleChange = useCallback(
    (userId: string, roleId: string) =>
      handleRequestRoleChange("active", userId, roleId),
    [handleRequestRoleChange],
  );

  return (
    <>
      <>
        <ActiveUsers
          roles={roles}
          tableDescription={t("activeUsersTableDescription")}
          tableTitle={t("activeUsersHeading")}
          users={rows.active}
          busyUserId={busyUserId}
          isSubmitting={isSubmitting}
          onRequestRoleChange={handleActiveRoleChange}
        />

        <LegacySystemUsers
          tableDescription={t("legacySystemUsersHeading")}
          tableTitle={t("legacySystemUsersTableDescription")}
          users={rows.legacy}
        />

        <PendingUsers
          tableDescription={t("pendingUsersHeading")}
          tableTitle={t("pendingUsersTableDescription")}
          users={rows.pending}
        />
      </>

      <ConfirmRoleChangeModal
        modalRef={modalRef}
        nextRoleName={nextRoleName}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmClick}
        onCancel={handleCloseDialog}
      />
    </>
  );
}
