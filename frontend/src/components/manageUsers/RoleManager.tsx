"use client";

import { useState } from "react";

interface RoleOption {
  value: string;
  label: string;
}

interface RoleManagerProps {
  organizationId: string;
  userId: string;
  currentRoleId: string;
  roleOptions: RoleOption[];
}

export function RoleManager({
  organizationId,
  userId,
  currentRoleId,
  roleOptions,
}: RoleManagerProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRoleLabel =
    roleOptions.find((r) => r.value === currentRoleId)?.label ?? currentRoleId;

  const pendingRoleLabel =
    pendingRoleId &&
    (roleOptions.find((r) => r.value === pendingRoleId)?.label ?? pendingRoleId);

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextRoleId = event.target.value;

    // no-op if same role
    if (nextRoleId === selectedRoleId) return;

    setPendingRoleId(nextRoleId);
    setIsModalOpen(true);
    setError(null);
  };

  const handleCancel = () => {
    setPendingRoleId(null);
    setIsModalOpen(false);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!pendingRoleId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 🔧 Swap this for your real API route / server action
      const response = await fetch(
        `/api/organizations/${organizationId}/users/${userId}/role`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roleId: pendingRoleId }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      setSelectedRoleId(pendingRoleId);
      setIsModalOpen(false);
      setPendingRoleId(null);
    } catch (err) {
      console.error(err);
      setError("We couldn't update this user's role. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <select
        className="usa-select width-full"
        value={selectedRoleId}
        onChange={handleSelectChange}
        aria-label={`Change role for this user`}
      >
        {roleOptions.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>

      {isModalOpen && (
        <div
          className="usa-modal is-visible"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`role-change-heading-${userId}`}
        >
          <div className="usa-modal__content">
            <h3
              id={`role-change-heading-${userId}`}
              className="usa-modal__heading"
            >
              Confirm role change
            </h3>

            <div className="usa-prose">
              <p>
                Are you sure you want to change this user&apos;s role from{" "}
                <strong>{currentRoleLabel}</strong> to{" "}
                <strong>{pendingRoleLabel}</strong>?
              </p>
              {error && (
                <p className="usa-error-message margin-top-1">{error}</p>
              )}
            </div>

            <div className="usa-modal__footer display-flex flex-justify-end">
              <button
                type="button"
                className="usa-button usa-button--unstyled margin-right-2"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="usa-button"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}